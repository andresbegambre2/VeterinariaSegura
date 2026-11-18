import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { solicitudSegura } from "../services/seguridad.service";

export default function CodigosRecuperacion({ volver }) {
  const { token, logout } = useAuth();
  const [codigos, setCodigos] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function generar(evento) {
    evento.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await solicitudSegura("/api/auth/codigos-recuperacion", {
        token,
        method: "POST",
        body: { cantidad: 8 },
      });
      setCodigos(respuesta.codigos ?? []);
    } catch (e) {
      if (e.status === 401) { logout(); return; }
      setError(e.message || "No fue posible generar los códigos.");
    } finally {
      setCargando(false);
    }
  }

  function descargar() {
    const texto = ["Veterinaria Segura — códigos de recuperación", "Guárdalos en un lugar seguro.", "", ...codigos].join("\n");
    const enlace = document.createElement("a");
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    enlace.href = url;
    enlace.download = "codigos-recuperacion-veterinaria.txt";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return <section className="hospital-card p-4 mt-4">
    <h2 className="h4 fw-bold">Seguridad de mi cuenta</h2>
    <p className="text-secondary">Los códigos permiten recuperar el acceso si olvidas tu contraseña. Cada código sirve una sola vez. Generar nuevos códigos invalida los anteriores.</p>
    {codigos.length ? <div className="alert alert-warning">
      <strong>Guarda estos códigos ahora.</strong> Solo se muestran en este momento.
      <div className="row row-cols-1 row-cols-sm-2 g-2 my-3">{codigos.map((codigo) => <div className="col" key={codigo}><code className="d-block p-2 bg-white border rounded text-dark">{codigo}</code></div>)}</div>
      <div className="d-flex flex-wrap gap-2"><button type="button" className="btn btn-outline-dark" onClick={descargar}>Guardar archivo</button><button type="button" className="btn btn-success" onClick={() => setCodigos([])}>Ya los guardé</button></div>
    </div> : <form onSubmit={generar} className="d-grid gap-3" style={{ maxWidth: 540 }}>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <button className="btn btn-success" disabled={cargando}>{cargando ? "Generando…" : "Generar ocho códigos"}</button>
    </form>}
    <button type="button" className="btn btn-outline-secondary mt-3" onClick={volver}>Volver al panel</button>
  </section>;
}
