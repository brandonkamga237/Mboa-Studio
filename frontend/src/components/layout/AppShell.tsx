import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/auth';
import { Avatar } from '../ui/Avatar';

function getPageTitle(pathname: string): string {
  if (pathname === '/tableau-de-bord') return 'Accueil';
  if (pathname === '/mes-brouillons') return 'Mes brouillons';
  if (/^\/brouillons\/\d+/.test(pathname)) return 'Brouillon';
  if (pathname === '/brouillons') return 'Équipe';
  if (pathname === '/historique') return 'Historique';
  if (pathname === '/presence') return 'Présence';
  if (pathname === '/admin') return 'Administration';
  return 'Mises en Commun';
}

export default function AppShell() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isResp = user?.role === 'responsable' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const path = location.pathname;
  const isDetailPage = /^\/brouillons\/\d+/.test(path);
  const pageTitle = getPageTitle(path);

  useEffect(() => { setSheetOpen(false); }, [path]);

  const tabs = [
    { to: '/tableau-de-bord', label: 'Accueil',    icon: <IcoHome /> },
    { to: '/mes-brouillons',  label: 'Brouillons', icon: <IcoFile /> },
    { to: '/brouillons',      label: 'Équipe',     icon: <IcoPeople /> },
    { to: '/historique',      label: 'Historique', icon: <IcoClock /> },
  ];

  const isActive = (to: string) => path === to || (to !== '/brouillons' && path.startsWith(to + '/'));

  return (
    <div className="app-shell">
      <div className="sidebar-desktop"><Sidebar /></div>

      <div className="app-main">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          {isDetailPage ? (
            <button className="topbar-btn" onClick={() => navigate(-1)} aria-label="Retour à la page précédente">
              <IcoBack />
            </button>
          ) : (
            <div style={{ width: 40 }} />
          )}
          <span className="topbar-title">{pageTitle}</span>
          <button className="topbar-btn" onClick={() => setSheetOpen(true)} aria-label="Ouvrir mon profil">
            {user ? <Avatar nom={user.nom} size={28} /> : <IcoUser />}
          </button>
        </div>

        <main className="page-content"><Outlet /></main>

        {/* Bottom navigation */}
        <nav className="bottom-nav" aria-label="Navigation principale">
          {tabs.map(tab => (
            <button
              key={tab.to}
              className={`bottom-nav-item${isActive(tab.to) ? ' active' : ''}`}
              onClick={() => navigate(tab.to)}
              aria-label={tab.label}
              aria-current={isActive(tab.to) ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
          <button
            className={`bottom-nav-item${sheetOpen ? ' active' : ''}`}
            onClick={() => setSheetOpen(o => !o)}
            aria-label="Mon profil"
            aria-expanded={sheetOpen}
          >
            <IcoUser />
            <span>Moi</span>
          </button>
        </nav>
      </div>

      {/* Profile bottom sheet */}
      {sheetOpen && (
        <>
          <div className="overlay" style={{ zIndex: 60 }} onClick={() => setSheetOpen(false)} />
          <div className="bottom-sheet" style={{ zIndex: 70 }}>
            <div className="bottom-sheet-handle" />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 20px 14px', marginTop: 8,
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              {user && <Avatar nom={user.nom} size={42} />}
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)' }}>{user?.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 1 }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ padding: '6px 0' }}>
              {isResp && (
                <button className="sheet-item" onClick={() => navigate('/presence')}>
                  <IcoShield /> Présence
                </button>
              )}
              {isAdmin && (
                <button className="sheet-item" onClick={() => navigate('/admin')}>
                  <IcoSettings /> Administration
                </button>
              )}
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 20px' }} />
              <button className="sheet-item danger" onClick={() => { logout(); navigate('/connexion'); }}>
                <IcoLogout /> Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IcoBack() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function IcoHome() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IcoFile() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function IcoPeople() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function IcoClock() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14.5"/></svg>;
}
function IcoUser() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IcoShield() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function IcoSettings() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}
function IcoLogout() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
