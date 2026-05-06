import type { StatutBrouillon } from '../../types';

const MAP: Record<StatutBrouillon, { label: string; cls: string; icon: React.ReactNode }> = {
  cree:           { label: 'Brouillon',   cls: 'pill-cree',      icon: <IcoDraft /> },
  en_revision:    { label: 'En révision', cls: 'pill-revision',  icon: <IcoBack /> },
  candidat_final: { label: 'En attente',  cls: 'pill-candidat',  icon: <IcoClock /> },
  officiel:       { label: 'Validé',      cls: 'pill-officiel',  icon: <IcoCheck /> },
  archive:        { label: 'Archivé',     cls: 'pill-archive',   icon: <IcoBox /> },
};

interface StatusPillProps {
  statut: StatutBrouillon;
}

export function StatusPill({ statut }: StatusPillProps) {
  const { label, cls, icon } = MAP[statut] ?? MAP.cree;
  return (
    <span
      className={cls}
      role="status"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function IcoDraft() {
  return <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="5" cy="5" r="3.5"/></svg>;
}
function IcoBack() {
  return <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 2 3 6 7 10"/><line x1="3" y1="6" x2="10" y2="6"/></svg>;
}
function IcoClock() {
  return <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><polyline points="6 3.5 6 6 7.8 7.2"/></svg>;
}
function IcoCheck() {
  return <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>;
}
function IcoBox() {
  return <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="9" height="9" rx="1"/><line x1="3.5" y1="6" x2="8.5" y2="6"/></svg>;
}
