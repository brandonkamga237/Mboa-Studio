import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { Spinner } from './components/ui/Spinner';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BrouillonListPage from './pages/BrouillonListPage';
import BrouillonDetailPage from './pages/BrouillonDetailPage';
import HistoriquePage from './pages/HistoriquePage';
import PresencePage from './pages/PresencePage';
import AdminPage from './pages/AdminPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuthStore();
  if (!token) return <Navigate to="/connexion" replace />;
  if (loading || !user) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: 12 }}>
      <Spinner size={28} />
      <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Chargement…</span>
    </div>
  );
  return <>{children}</>;
}

function RequireResp({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.role !== 'responsable' && user?.role !== 'admin') {
    return <Navigate to="/tableau-de-bord" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') return <Navigate to="/tableau-de-bord" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, loadMe } = useAuthStore();

  useEffect(() => {
    if (token) loadMe();
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connexion" element={<LoginPage />} />

        <Route element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }>
          <Route path="/tableau-de-bord" element={<DashboardPage />} />
          <Route path="/mes-brouillons" element={<BrouillonListPage mineOnly />} />
          <Route path="/brouillons" element={<BrouillonListPage />} />
          <Route path="/brouillons/:id" element={<BrouillonDetailPage />} />
          <Route path="/historique" element={<HistoriquePage />} />
          <Route path="/presence" element={
            <RequireResp><PresencePage /></RequireResp>
          } />
          <Route path="/admin" element={
            <RequireAdmin><AdminPage /></RequireAdmin>
          } />
        </Route>

        <Route path="/" element={<Navigate to="/tableau-de-bord" replace />} />
        <Route path="*" element={<Navigate to="/tableau-de-bord" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
