// Mises en Commun — Shared Components
// ui_kits/app/Components.jsx

const { useState } = React;

// ─── Avatar ───────────────────────────────────────────────
function Avatar({ name, size = 28, color }) {
  const colors = ['#1E2D4A','#2B4C7E','#C9952A','#15803D','#D97706','#7C3AED'];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const bg = color || colors[idx];
  const initials = name ? name.slice(0,1).toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: size * 0.38, fontWeight: 700,
      fontFamily: 'var(--font-body)', flexShrink: 0
    }}>{initials}</div>
  );
}

// ─── StatusPill ───────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    cree:      { label: 'Créé',          bg: '#E5E7EB', color: '#6B7280', dot: '#9CA3AF' },
    candidat:  { label: 'Candidat final', bg: '#FDE68A', color: '#92400E', dot: '#D97706' },
    officiel:  { label: 'Officiel',       bg: '#BBF7D0', color: '#14532D', dot: '#15803D' },
    archive:   { label: 'Archivé',        bg: '#F3F4F6', color: '#9CA3AF', dot: '#D1D5DB' },
  };
  const s = map[status] || map.cree;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }}></span>
      {s.label}
    </span>
  );
}

// ─── Btn ──────────────────────────────────────────────────
function Btn({ children, variant = 'secondary', size = 'md', onClick, disabled, style }) {
  const variants = {
    primary:   { background: '#1E2D4A', color: '#FDFAF7', border: 'none' },
    secondary: { background: '#FDFAF7', color: '#1E2D4A', border: '1px solid #D1C9BE' },
    gold:      { background: '#C9952A', color: 'white',   border: 'none' },
    ghost:     { background: 'transparent', color: '#2B4C7E', border: '1px solid transparent' },
    danger:    { background: '#DC2626', color: 'white',   border: 'none' },
  };
  const sizes = {
    sm: { padding: '4px 10px', fontSize: 11 },
    md: { padding: '7px 14px', fontSize: 13 },
    lg: { padding: '10px 20px', fontSize: 15 },
  };
  const v = variants[variant] || variants.secondary;
  const s = sizes[size] || sizes.md;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v, ...s,
        borderRadius: 6, fontFamily: 'var(--font-body)', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background 150ms ease',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        lineHeight: 1, whiteSpace: 'nowrap',
        ...style
      }}
    >{children}</button>
  );
}

// ─── Card ─────────────────────────────────────────────────
function Card({ children, style, leftColor }) {
  return (
    <div style={{
      background: '#FDFAF7',
      border: '1px solid #D1C9BE',
      borderLeft: leftColor ? `4px solid ${leftColor}` : '1px solid #D1C9BE',
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      padding: 20,
      ...style
    }}>{children}</div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.35)', padding: '8px 16px 4px'
    }}>{children}</div>
  );
}

// ─── NavItem ──────────────────────────────────────────────
function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px', cursor: 'pointer',
        fontSize: 13, color: active ? '#FDFAF7' : 'rgba(255,255,255,0.65)',
        fontWeight: active ? 600 : 400,
        background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
        transition: 'background 150ms ease, color 150ms ease',
        fontFamily: 'var(--font-body)',
        userSelect: 'none'
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ opacity: active ? 1 : 0.65, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          background: '#C9952A', color: 'white',
          fontSize: 10, fontWeight: 700,
          padding: '1px 6px', borderRadius: 999
        }}>{badge}</span>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────
function Sidebar({ activeScreen, onNavigate, userRole = 'moniteur' }) {
  const isResp = userRole === 'responsable' || userRole === 'admin';
  return (
    <div style={{
      width: 220, background: '#1E2D4A', display: 'flex', flexDirection: 'column',
      height: '100%', flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: '#FDFAF7' }}>
          Mises en Commun
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>
          Culte d'enfants
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, paddingTop: 8 }}>
        <NavItem
          icon={<IconGrid />} label="Tableau de bord"
          active={activeScreen === 'dashboard'} onClick={() => onNavigate('dashboard')}
        />
        <NavItem
          icon={<IconFile />} label="Mes brouillons"
          active={activeScreen === 'my-drafts'} onClick={() => onNavigate('my-drafts')}
          badge="1"
        />
        <NavItem
          icon={<IconList />} label="Brouillons de la semaine"
          active={activeScreen === 'week-drafts'} onClick={() => onNavigate('week-drafts')}
        />
        <NavItem
          icon={<IconClock />} label="Historique"
          active={activeScreen === 'history'} onClick={() => onNavigate('history')}
        />
        {isResp && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }}></div>
            <SectionLabel>Responsable</SectionLabel>
            <NavItem
              icon={<IconShield />} label="Présence"
              active={activeScreen === 'presence'} onClick={() => onNavigate('presence')}
            />
          </>
        )}
        {userRole === 'admin' && (
          <NavItem
            icon={<IconSettings />} label="Administration"
            active={activeScreen === 'admin'} onClick={() => onNavigate('admin')}
          />
        )}
      </div>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name="Marie" size={28} />
        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)' }}>Marie</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{userRole}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Icons (inline SVG, Lucide-style) ────────────────────
function IconGrid() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg>;
}
function IconFile() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 2h6l4 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><polyline points="9 2 9 6 13 6"/><line x1="5" y1="9" x2="11" y2="9"/><line x1="5" y1="12" x2="8" y2="12"/></svg>;
}
function IconList() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="12" x2="9" y2="12"/></svg>;
}
function IconClock() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><polyline points="8 5 8 8 10.5 10"/></svg>;
}
function IconShield() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1.5l5 2v4c0 3-2.5 5.5-5 6.5C5.5 13 3 10.5 3 7.5v-4l5-2z"/></svg>;
}
function IconSettings() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42"/></svg>;
}
function IconPlus() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>;
}
function IconDownload() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v8M5 7l3 3 3-3"/><path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg>;
}
function IconMessage() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z"/></svg>;
}
function IconCheck() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="2 8 6 12 14 4"/></svg>;
}
function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>;
}
function IconCopy() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="5" width="9" height="9" rx="1"/><path d="M3 11H2a1 1 0 01-1-1V2a1 1 0 011-1h8a1 1 0 011 1v1"/></svg>;
}
function IconMusic() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="4.5" cy="12" r="2"/><circle cx="11.5" cy="10" r="2"/><line x1="6.5" y1="12" x2="6.5" y2="4"/><line x1="13.5" y1="10" x2="13.5" y2="2"/><line x1="6.5" y1="4" x2="13.5" y2="2"/></svg>;
}
function IconBook() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3a1 1 0 011-1h4a3 3 0 013 3v9a3 3 0 00-3-3H3a1 1 0 01-1-1V3z"/><path d="M14 3a1 1 0 00-1-1H9a3 3 0 00-3 3v9a3 3 0 013-3h4a1 1 0 001-1V3z"/></svg>;
}
function IconChevronRight() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="6 3 11 8 6 13"/></svg>;
}

// Export all to window
Object.assign(window, {
  Avatar, StatusPill, Btn, Card, SectionLabel, NavItem, Sidebar,
  IconGrid, IconFile, IconList, IconClock, IconShield, IconSettings,
  IconPlus, IconDownload, IconMessage, IconCheck, IconSearch, IconCopy,
  IconMusic, IconBook, IconChevronRight
});
