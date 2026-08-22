import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/kit";
import { LoginPage, ROLE_HOME } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { GrillePage } from "./pages/admin/GrillePage";
import { DirecteurPage } from "./pages/directeur/DirecteurPage";
import { RegieDashboard } from "./pages/regie/RegieDashboard";
import { GrillePublique } from "./pages/public/GrillePublique";
import type { Role } from "./utils/epgHelpers";
import type { ReactNode } from "react";

function Garde({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

function Accueil() {
  const { user } = useAuth();
  return <Navigate to={user ? ROLE_HOME[user.role] : "/grille"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/grille" element={<GrillePublique />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <Garde role="admin">
                  <AdminDashboard />
                </Garde>
              }
            />
            <Route
              path="/admin/grille"
              element={
                <Garde role="admin">
                  <GrillePage />
                </Garde>
              }
            />
            <Route
              path="/directeur"
              element={
                <Garde role="directeur">
                  <DirecteurPage />
                </Garde>
              }
            />
            <Route
              path="/regie"
              element={
                <Garde role="regie">
                  <RegieDashboard />
                </Garde>
              }
            />
            <Route path="*" element={<Navigate to="/grille" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
