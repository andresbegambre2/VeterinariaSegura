import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { solicitudSegura } from "../services/seguridad.service";
import CodigosRecuperacion from "../components/CodigosRecuperacion";
import CambiarPassword from "../components/CambiarPassword";
import RecuperacionAdministrativa from "../components/RecuperacionAdministrativa";

const recursos = {
  usuarios: { titulo: "Usuarios", ruta: "/api/usuarios", roles: ["administrador"] },
  propietarios: { titulo: "Propietarios", ruta: "/api/propietarios", roles: ["administrador", "veterinario"] },
  mascotas: { titulo: "Mascotas", ruta: "/api/mascotas", roles: ["administrador", "veterinario"] },
  veterinarios: { titulo: "Veterinarios", ruta: "/api/veterinarios", roles: ["administrador", "veterinario", "propietario"] },
  citas: { titulo: "Citas", ruta: "/api/citas", roles: ["administrador"] },
  "mis-citas": { titulo: "Mis citas", ruta: "/api/citas/mis-citas", roles: ["veterinario", "propietario"] },
};

function normalizarLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.datos)) return respuesta.datos;
  if (Array.isArray(respuesta?.items)) return respuesta.items;
  return respuesta ? [respuesta] : [];
}

function tituloColumna(valor) {
  return valor.replace(/([A-Z])/g, " $1").replace(/^./, (letra) => letra.toUpperCase());
}

export default function VeterinariaDashboard() {
  const { usuario, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [vista, setVista] = useState("inicio");
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resumen, setResumen] = useState(null);
  const [errorResumen, setErrorResumen] = useState("");
  const [recargar, setRecargar] = useState(0);

  const disponibles = useMemo(() => Object.entries(recursos).filter(([, dato]) => dato.roles.includes(usuario?.rol)), [usuario?.rol]);
  const cargar = useCallback(async (clave) => {
    const recurso = recursos[clave];
    if (!recurso || !recurso.roles.includes(usuario?.rol)) return;
    setCargando(true);
    setError("");
    try {
      const respuesta = await solicitudSegura(recurso.ruta, { token });
      setFilas(normalizarLista(respuesta));
    } catch (e) {
      setFilas([]);
      setError(e.message || "No fue posible cargar la información.");
    } finally {
      setCargando(false);
    }
  }, [token, usuario?.rol]);

  useEffect(() => {
    if (vista !== "inicio") cargar(vista);
  }, [vista, cargar, recargar]);

  useEffect(() => {
    if (vista !== "inicio") return undefined;
    const controller = new AbortController();
    solicitudSegura("/api/estadisticas/resumen", { token, signal: controller.signal })
      .then((datos) => { if (!controller.signal.aborted) { setResumen(datos.resumen ?? null); setErrorResumen(""); } })
      .catch((e) => { if (!controller.signal.aborted) { setResumen(null); setErrorResumen(e.message || "No fue posible cargar los indicadores."); } });
    return () => controller.abort();
  }, [vista, token, recargar]);

  useEffect(() => {
    if (!location.pathname.endsWith("/dashboard")) {
      const clave = location.pathname.slice(1);
      if (recursos[clave]?.roles.includes(usuario?.rol) || ["seguridad-cuenta", "cambiar-password"].includes(clave) || (clave === "recuperacion-administrativa" && usuario?.rol === "administrador")) setVista(clave);
      else setVista("inicio");
    } else setVista("inicio");
  }, [location.pathname, usuario?.rol]);

  const columnas = filas.length ? Object.keys(filas[0]).filter((key) => !/password|hash|token|secret/i.test(key)) : [];
  const contadores = usuario?.rol === "administrador"
    ? [{ etiqueta: "Usuarios", key: "usuarios", icono: "♙" }, { etiqueta: "Veterinarios", key: "veterinarios", icono: "✚" }, { etiqueta: "Propietarios", key: "propietarios", icono: "♧" }, { etiqueta: "Mascotas", key: "mascotas", icono: "🐾" }, { etiqueta: "Citas", key: "citas", icono: "▦" }]
    : [{ etiqueta: "Mascotas", key: "mascotas", icono: "🐾" }, { etiqueta: "Citas", key: "mis-citas", icono: "▦" }, { etiqueta: "Programadas", key: "mis-citas", icono: "◷", metric: "programadas" }, { etiqueta: "Atendidas", key: "mis-citas", icono: "✓", metric: "atendidas" }];

  function abrir(clave) {
    setVista(clave);
    navigate(`/${clave}`);
  }
  function inicio() {
    setVista("inicio");
    navigate("/dashboard");
  }

  return (
    <div className="vet-shell">
      <aside className="vet-sidebar">
        <button className="vet-brand" onClick={inicio} aria-label="Ir al inicio"><span className="vet-brand-mark">V</span><span>Veterinaria<span className="vet-brand-sub">Segura</span></span></button>
        <p className="vet-menu-caption">MENÚ PRINCIPAL</p>
        <button className={`vet-nav ${vista === "inicio" ? "active" : ""}`} onClick={inicio}><span>⌂</span> Inicio</button>
        {disponibles.map(([clave, dato]) => <button key={clave} className={`vet-nav ${vista === clave ? "active" : ""}`} onClick={() => abrir(clave)}><span>{clave === "mascotas" ? "🐾" : clave === "citas" || clave === "mis-citas" ? "▦" : "♙"}</span>{dato.titulo}</button>)}
        <button className={`vet-nav ${vista === "seguridad-cuenta" ? "active" : ""}`} onClick={() => abrir("seguridad-cuenta")}><span>♧</span> Seguridad de la cuenta</button>
        <button className={`vet-nav ${vista === "cambiar-password" ? "active" : ""}`} onClick={() => abrir("cambiar-password")}><span>⚿</span> Cambiar contraseña</button>
        {usuario?.rol === "administrador" && <button className={`vet-nav ${vista === "recuperacion-administrativa" ? "active" : ""}`} onClick={() => abrir("recuperacion-administrativa")}><span>♙</span> Recuperación administrativa</button>}
        <div className="vet-sidebar-bottom"><span className="vet-avatar">{(usuario?.nombre || "U").slice(0, 1).toUpperCase()}</span><span className="vet-user"><b>{usuario?.nombre || "Usuario"}</b><small>{usuario?.rol || "cuenta"}</small></span><button className="vet-logout" onClick={() => { logout(); navigate("/login"); }}>Salir</button></div>
      </aside>
      <main className="vet-main">
        <header className="vet-topbar"><span>V+ <b>Veterinaria Segura</b></span><span className="vet-top-user">{usuario?.nombre} <small>{usuario?.rol}</small></span></header>
        <div className="vet-content">
          <div className="vet-welcome"><div><small>Bienvenido{usuario?.nombre ? `, ${usuario.nombre}` : ""}</small><h1>{vista === "inicio" ? `Panel ${usuario?.rol || "de usuario"}` : recursos[vista]?.titulo}</h1><p>Gestión segura de mascotas, propietarios y citas veterinarias.</p><span className="vet-role-pill">Rol {usuario?.rol || "usuario"}</span></div><div className="vet-paw-art" aria-hidden="true">🐾</div></div>
          {vista === "seguridad-cuenta" ? <CodigosRecuperacion volver={inicio} /> : vista === "cambiar-password" ? <CambiarPassword volver={inicio} /> : vista === "recuperacion-administrativa" ? <RecuperacionAdministrativa volver={inicio} /> : vista === "inicio" ? <>
            <div className="vet-section-heading"><div><h2>Resumen</h2><p>Acceso a la información permitida para tu cuenta.</p></div></div>
            <div className="vet-stats">{contadores.map((item) => <button key={item.etiqueta} className="vet-stat" onClick={() => { if (recursos[item.key]?.roles.includes(usuario?.rol)) abrir(item.key); }}><span>{item.icono}</span><b>{resumen ? resumen[item.metric || item.key] ?? 0 : "—"}</b><small>{item.etiqueta}</small></button>)}</div>
            {errorResumen && <p className="vet-error" role="status">{errorResumen}</p>}
            <section className="vet-panel"><div className="vet-panel-title"><div><h2>Accesos disponibles</h2><p>Los permisos se verifican nuevamente en el servidor.</p></div></div><div className="vet-shortcuts">{disponibles.map(([clave, dato]) => <button key={clave} onClick={() => abrir(clave)}><span>{clave === "mascotas" ? "🐾" : clave.includes("cita") ? "▦" : "♙"}</span><b>{dato.titulo}</b><small>Ver información autorizada →</small></button>)}</div></section>
          </> : <section className="vet-panel vet-data-panel"><div className="vet-panel-title"><div><h2>{recursos[vista]?.titulo}</h2><p>Información visible según el rol de tu cuenta.</p></div><button className="vet-refresh" onClick={() => setRecargar((n) => n + 1)}>Actualizar</button></div>
            {error && <div className="vet-error" role="alert">{error}</div>}
            {cargando ? <p className="vet-empty">Cargando información…</p> : filas.length && columnas.length ? <div className="vet-table-wrap"><table className="vet-table"><thead><tr>{columnas.map((key) => <th key={key}>{tituloColumna(key)}</th>)}</tr></thead><tbody>{filas.map((fila, indice) => <tr key={fila.id ?? indice}>{columnas.map((key) => <td key={key}>{typeof fila[key] === "boolean" ? fila[key] ? "Sí" : "No" : String(fila[key] ?? "—")}</td>)}</tr>)}</tbody></table></div> : !error && <p className="vet-empty">No hay registros para mostrar.</p>}
          </section>}
        </div>
      </main>
    </div>
  );
}
