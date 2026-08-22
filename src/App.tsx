import type { ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { ToastProvider } from "./components/ui";
import { LoginPage, ROLE_HOME } from "./pages/LoginPage";
import { ViewerPortal } from "./pages/ViewerPortal";
import { GuideTv } from "./pages/GuideTv";
import { DirecteurDashboard } from "./pages/DirecteurDashboard";
import { RegieDashboard } from "./pages/RegieDashboard";
import type { Role } from "./types";

/** Garde par rôle (cas d'utilisation « S'Authentifier » + redirection). */
function Garde({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

/** Page de connexion — redirige si déjà authentifié. */
function PageLogin() {
  const { user } = useApp();
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            {/* Téléspectateur — Consulter Site/TV, Sélectionner & Afficher Grille */}
            <Route path="/" element={<ViewerPortal />} />
            <Route path="/guide" element={<GuideTv />} />

            {/* S'Authentifier */}
            <Route path="/login" element={<PageLogin />} />

            {/* Directeur d'Antenne — Créer / Importer / Modifier / Supprimer Grille */}
            <Route
              path="/directeur"
              element={
                <Garde role="directeur">
                  <DirecteurDashboard />
                </Garde>
              }
            />

            {/* Régie Diffusion — Valider / Modifier / Supprimer en temps réel */}
            <Route
              path="/regie"
              element={
                <Garde role="regie">
                  <RegieDashboard />
                </Garde>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AppProvider>
  );
}
