const crypto = require("node:crypto");

const obtenerSecretoRecuperacion = () => {
  const secret = process.env.RECOVERY_SECRET;

  if (!secret || secret.length < 32) {
    const error = new Error(
      "RECOVERY_SECRET debe estar configurado con al menos 32 caracteres"
    );
    error.codigoAplicacion = "RECOVERY_CONFIG_INVALIDA";
    throw error;
  }

  return secret;
};

const normalizarCodigo = (codigo) =>
  String(codigo || "")
    .replace(/[^A-Fa-f0-9]/g, "")
    .toUpperCase();

const generarCodigoRecuperacion = () => {
  const texto = crypto.randomBytes(10).toString("hex").toUpperCase();
  return texto.match(/.{1,4}/g).join("-");
};

const generarTokenRecuperacion = () =>
  crypto.randomBytes(32).toString("base64url");

const hashSecretoRecuperacion = (valor) =>
  crypto
    .createHmac("sha256", obtenerSecretoRecuperacion())
    .update(String(valor))
    .digest("hex");

const hashCodigoRecuperacion = (codigo) =>
  hashSecretoRecuperacion(normalizarCodigo(codigo));

module.exports = {
  generarCodigoRecuperacion,
  generarTokenRecuperacion,
  hashCodigoRecuperacion,
  hashSecretoRecuperacion,
  normalizarCodigo
};
