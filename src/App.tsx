import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import { StudioProvider, useStudio } from "./state/store";
import { ToastProvider } from "./components/shared";
import { PublicPortal } from "./pages/PublicPortal";
import { PublicGuide } from "./pages/PublicGuide";
import { LoginPage } from "./pages/LoginPage";
import { BackOfficeShell } from "./backoffice/BackOfficeShell";
import { AdminBuilder } from "./backoffice/AdminBuilder";
import { DirecteurKanban } from "./backoffice/DirecteurKanban";
import { RegieControl } from "./backoffice/RegieControl";

/** Back-office : garde d'authentification + vue selon le rôle actif. */
function Studio() {
  const { role } = useStudio();
  const location = useLocation();
  if (!role) return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <BackOfficeShell>
      {role === "admin" && <AdminBuilder />}
      {role === "directeur" && <DirecteurKanban />}
      {role === "regie" && <RegieControl />}
    </BackOfficeShell>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            {/* ——— Module 1 : Portail public téléspectateur ——— */}
            <Route path="/" element={<PublicPortal />} />
            <Route path="/guide" element={<PublicGuide />} />

            {/* ——— Authentification commune ——— */}
            <Route path="/login" element={<LoginPage />} />

            {/* ——— Module 2 : Back-office (Admin / Directeur / Régie) ——— */}
            <Route path="/studio" element={<Studio />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StudioProvider>
  );
}
