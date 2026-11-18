const { consultar, pool } = require("../config/database");
const { generarPasswordHash } = require("../utils/password.util");
const {
  generarCodigoRecuperacion,
  generarTokenRecuperacion,
  hashCodigoRecuperacion,
  hashSecretoRecuperacion
} = require("../utils/recovery.util");

const errorAplicacion = (mensaje, status, codigo) => {
  const error = new Error(mensaje);
  error.status = status;
  error.codigoAplicacion = codigo;
  return error;
};

const ejecutarTransaccion = async (operacion) => {
  const cliente = await pool.connect();
  let iniciada = false;

  try {
    await cliente.query("BEGIN");
    iniciada = true;
    const resultado = await operacion(cliente);
    await cliente.query("COMMIT");
    iniciada = false;
    return resultado;
  } catch (error) {
    if (iniciada) {
      try {
        await cliente.query("ROLLBACK");
      } catch (_) {
        // El error original contiene la causa que debe manejar la API.
      }
    }
    throw error;
  } finally {
    cliente.release();
  }
};

const generarCodigos = async (usuarioId, cantidad = 8) => {
  const codigos = Array.from(
    { length: cantidad },
    () => generarCodigoRecuperacion()
  );

  await ejecutarTransaccion(async (cliente) => {
    const usuario = await cliente.query(
      `SELECT id
       FROM public.usuarios
       WHERE id = $1 AND activo = TRUE
       FOR UPDATE`,
      [usuarioId]
    );

    if (usuario.rows.length === 0) {
      throw errorAplicacion("Usuario no encontrado", 404, "USUARIO_NO_ENCONTRADO");
    }

    await cliente.query(
      `UPDATE public.codigos_recuperacion
       SET fecha_uso = NOW()
       WHERE usuario_id = $1 AND fecha_uso IS NULL`,
      [usuarioId]
    );

    for (const codigo of codigos) {
      await cliente.query(
        `INSERT INTO public.codigos_recuperacion (usuario_id, codigo_hash)
         VALUES ($1, $2)`,
        [usuarioId, hashCodigoRecuperacion(codigo)]
      );
    }
  });

  return codigos;
};

const restablecerConCodigo = async ({ email, codigo, nuevaPassword }) => {
  const codigoHash = hashCodigoRecuperacion(codigo);
  const passwordHash = await generarPasswordHash(nuevaPassword);

  return ejecutarTransaccion(async (cliente) => {
    const resultado = await cliente.query(
      `SELECT cr.id, cr.usuario_id
       FROM public.codigos_recuperacion cr
       INNER JOIN public.usuarios u ON u.id = cr.usuario_id
       WHERE LOWER(u.email) = LOWER($1)
         AND cr.codigo_hash = $2
         AND cr.fecha_uso IS NULL
         AND u.activo = TRUE
       FOR UPDATE OF cr, u`,
      [email, codigoHash]
    );

    if (resultado.rows.length === 0) {
      throw errorAplicacion(
        "Código de recuperación inválido o utilizado",
        400,
        "CODIGO_RECUPERACION_INVALIDO"
      );
    }

    const { id, usuario_id: usuarioId } = resultado.rows[0];

    await cliente.query(
      `UPDATE public.usuarios
       SET password_hash = $1,
           version_sesion = version_sesion + 1
       WHERE id = $2`,
      [passwordHash, usuarioId]
    );
    await cliente.query(
      `UPDATE public.codigos_recuperacion
       SET fecha_uso = NOW()
       WHERE usuario_id = $1 AND fecha_uso IS NULL`,
      [usuarioId]
    );
    await cliente.query(
      `UPDATE public.password_reset_tokens
       SET fecha_uso = NOW()
       WHERE usuario_id = $1 AND fecha_uso IS NULL`,
      [usuarioId]
    );

    return { usuarioId: String(usuarioId), codigoId: String(id) };
  });
};

const obtenerTtlMinutos = () => {
  const valor = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 15);
  return Number.isInteger(valor) && valor >= 5 && valor <= 60 ? valor : 15;
};

const emitirTokenAdministrativo = async ({ administradorId, usuarioId }) => {
  const token = generarTokenRecuperacion();
  const tokenHash = hashSecretoRecuperacion(token);
  const ttlMinutos = obtenerTtlMinutos();

  return ejecutarTransaccion(async (cliente) => {
    const administrador = await cliente.query(
      `SELECT u.id
       FROM public.usuarios u
       INNER JOIN public.roles r ON r.id = u.rol_id
       WHERE u.id = $1
         AND u.activo = TRUE
         AND r.nombre = 'administrador'
       FOR UPDATE OF u`,
      [administradorId]
    );

    if (administrador.rows.length === 0) {
      throw errorAplicacion("Operación no autorizada", 403, "ADMIN_REQUERIDO");
    }

    const usuario = await cliente.query(
      `SELECT id
       FROM public.usuarios
       WHERE id = $1 AND activo = TRUE
       FOR UPDATE`,
      [usuarioId]
    );

    if (usuario.rows.length === 0) {
      throw errorAplicacion("Usuario no encontrado", 404, "USUARIO_NO_ENCONTRADO");
    }

    await cliente.query(
      `UPDATE public.password_reset_tokens
       SET fecha_uso = NOW()
       WHERE usuario_id = $1 AND fecha_uso IS NULL`,
      [usuarioId]
    );

    const insertado = await cliente.query(
      `INSERT INTO public.password_reset_tokens (
         usuario_id,
         administrador_id,
         token_hash,
         fecha_expiracion
       )
       VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 minute'))
       RETURNING id, fecha_expiracion AS "fechaExpiracion"`,
      [usuarioId, administradorId, tokenHash, ttlMinutos]
    );

    return {
      id: String(insertado.rows[0].id),
      token,
      fechaExpiracion: insertado.rows[0].fechaExpiracion
    };
  });
};

const restablecerConToken = async ({ token, nuevaPassword }) => {
  const tokenHash = hashSecretoRecuperacion(token);
  const passwordHash = await generarPasswordHash(nuevaPassword);

  return ejecutarTransaccion(async (cliente) => {
    const resultado = await cliente.query(
      `SELECT prt.id, prt.usuario_id
       FROM public.password_reset_tokens prt
       INNER JOIN public.usuarios u ON u.id = prt.usuario_id
       WHERE prt.token_hash = $1
         AND prt.fecha_uso IS NULL
         AND prt.fecha_expiracion > NOW()
         AND u.activo = TRUE
       FOR UPDATE OF prt, u`,
      [tokenHash]
    );

    if (resultado.rows.length === 0) {
      throw errorAplicacion(
        "Token de recuperación inválido, vencido o utilizado",
        400,
        "TOKEN_RECUPERACION_INVALIDO"
      );
    }

    const { id, usuario_id: usuarioId } = resultado.rows[0];

    await cliente.query(
      `UPDATE public.usuarios
       SET password_hash = $1,
           version_sesion = version_sesion + 1
       WHERE id = $2`,
      [passwordHash, usuarioId]
    );
    await cliente.query(
      `UPDATE public.password_reset_tokens
       SET fecha_uso = NOW()
       WHERE usuario_id = $1 AND fecha_uso IS NULL`,
      [usuarioId]
    );
    await cliente.query(
      `UPDATE public.codigos_recuperacion
       SET fecha_uso = NOW()
       WHERE usuario_id = $1 AND fecha_uso IS NULL`,
      [usuarioId]
    );

    return { usuarioId: String(usuarioId), tokenId: String(id) };
  });
};

module.exports = {
  generarCodigos,
  restablecerConCodigo,
  emitirTokenAdministrativo,
  restablecerConToken,
  obtenerTtlMinutos,
  consultar
};
