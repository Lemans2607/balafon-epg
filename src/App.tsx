import type { ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { StudioProvider, useStudio } from "./state/store";
import { ThemeProvider } from "./state/themeStore";
import { ToastProvider } from "./components/shared";
import { PublicPortal } from "./pages/PublicPortal";
import { PublicGuide } from "./pages/PublicGuide";
import { LoginPage } from "./pages/LoginPage";
import { StaffShell } from "./backoffice/BackOfficeShell";
import { StudioDashboard } from "./backoffice/StudioDashboard";
import { AdminBuilder } from "./backoffice/AdminBuilder";
import { DirecteurKanban } from "./backoffice/DirecteurKanban";
import { RegieControl } from "./backoffice/RegieControl";
import { ComptesPage } from "./backoffice/ComptesPage";

/**
 * Protection des routes back-office : authentification requise + layout
 * StaffShell (sidebar + topbar). Le rôle actif pilote la vue et le switcheur.
 */
function StudioRoute({ children }: { children: ReactNode }) {
  const { role } = useStudio();
  const location = useLocation();
  if (!role) return <Navigate to="/login" replace state={{ from: location }} />;
  return <StaffShell>{children}</StaffShell>;
}

export default function App() {
  return (
    <ThemeProvider>
      <StudioProvider>
        <ToastProvider>
          <HashRouter>
            <Routes>
              {/* ——— Module 1 : Portail public Balafon TV (TV uniquement) ——— */}
              <Route path="/" element={<PublicPortal />} />
              <Route path="/tv" element={<PublicPortal />} />
              <Route path="/guide" element={<PublicGuide />} />
              <Route path="/tv/guide" element={<PublicGuide />} />

              {/* ——— Authentification commune (+ route démo) ——— */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/demo" element={<LoginPage />} />

              {/* ——— Module 2 : Back-office Balafon Studio ——— */}
              <Route
                path="/studio"
                element={
                  <StudioRoute>
                    <StudioDashboard />
                  </StudioRoute>
                }
              />
              <Route
                path="/studio/grilles"
                element={
                  <StudioRoute>
                    <AdminBuilder />
                  </StudioRoute>
                }
              />
              <Route
                path="/studio/directeur"
                element={
                  <StudioRoute>
                    <DirecteurKanban />
                  </StudioRoute>
                }
              />
              <Route
                path="/studio/regie"
                element={
                  <StudioRoute>
                    <RegieControl />
                  </StudioRoute>
                }
              />
              <Route
                path="/studio/comptes"
                element={
                  <StudioRoute>
                    <ComptesPage />
                  </StudioRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </ToastProvider>
      </StudioProvider>
    </ThemeProvider>
  );
}
