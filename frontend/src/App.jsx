import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida";
import LoginPage from "./pages/LoginPage";
import RecuperarPasswordPage from "./pages/RecuperarPasswordPage";
import VeterinariaDashboard from "./pages/VeterinariaDashboard";
import RestablecerTokenPage from "./pages/RestablecerTokenPage";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
          <Route path="/restablecer-token" element={<RestablecerTokenPage />} />
          <Route element={<RutaProtegida />}>
            <Route path="/dashboard" element={<VeterinariaDashboard />} />
            { ["usuarios", "propietarios", "mascotas", "veterinarios", "citas", "mis-citas", "seguridad-cuenta", "cambiar-password", "recuperacion-administrativa"].map((ruta) => (
              <Route key={ruta} path={`/${ruta}`} element={<VeterinariaDashboard />} />
            )) }
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
