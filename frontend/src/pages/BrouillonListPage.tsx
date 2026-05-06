import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBrouillons, createBrouillon } from '../api/client';
import { useAuthStore } from '../store/auth';
import { BrouillonCard } from '../components/brouillon/BrouillonCard';
import { Spinner } from '../components/ui/Spinner';
import type { BrouillonSummary } from '../types';
import toast from 'react-hot-toast';

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextSunday(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? 7 : 7 - day));
  return localDateStr(d);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

const STATUS_ORDER = ['officiel', 'candidat_final', 'en_revision', 'cree', 'archive'];

interface BrouillonListPageProps {
  mineOnly?: boolean;
}

export default function BrouillonListPage({ mineOnly = false }: BrouillonListPageProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [brouillons, setBrouillons] = useState<BrouillonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(nextSunday());
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const params: { auteur_id?: number } = {};
      if (mineOnly && user) params.auteur_id = user.id;
      const data = await getBrouillons(params);
      setBrouillons(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [mineOnly, user?.id]);

  useEffect(() => {
    if (!fabOpen) return;
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setFabOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [fabOpen]);

  const handleCreate = async (date: string) => {
    setCreating(true);
    setFabOpen(false);
    try {
      const b = await createBrouillon({ date_dimanche: date });
      navigate(`/brouillons/${b.id}`);
    } catch {
      toast.error('Impossible de créer le brouillon.');
    } finally {
      setCreating(false);
    }
  };

  // Group by date_dimanche desc, sort each group by status priority
  const grouped = brouillons.reduce<Record<string, BrouillonSummary[]>>((acc, b) => {
    (acc[b.date_dimanche] ??= []).push(b);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  sortedDates.forEach(d => {
    grouped[d].sort((a, b) => STATUS_ORDER.indexOf(a.statut) - STATUS_ORDER.indexOf(b.statut));
  });

  // ── États spéciaux ──────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ paddingTop: 48 }}>
        <div className="empty-state-icon"><IcoAlertCircle /></div>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg-primary)', marginBottom: 4 }}>
          Impossible de charger les brouillons
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }}>
          Vérifie ta connexion puis réessaie.
        </div>
        <button className="btn btn-primary btn-sm" onClick={load}>Réessayer</button>
      </div>
    );
  }

  if (brouillons.length === 0) {
    return (
      <>
        <div className="empty-state" style={{ paddingTop: 48 }}>
          <div className="empty-state-icon"><IcoFileEmpty /></div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg-primary)', marginBottom: 4 }}>
            {mineOnly ? 'Aucun brouillon pour l\'instant' : 'Aucun brouillon cette semaine'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }}>
            {mineOnly
              ? 'Crée ton premier brouillon pour commencer.'
              : 'Personne n\'a encore soumis de brouillon.'}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => handleCreate(selectedDate)} disabled={creating}>
            {creating ? <Spinner size={14} /> : '+ Créer un brouillon'}
          </button>
        </div>
        <FabCreate
          fabRef={fabRef} fabOpen={fabOpen} setFabOpen={setFabOpen}
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          onCreate={handleCreate} creating={creating}
        />
      </>
    );
  }

  return (
    <div className="page-wrapper" style={{ paddingBottom: 80 }}>

      {/* Desktop: row de création */}
      <div className="desktop-create-row" style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <input
          type="date"
          className="field"
          style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" onClick={() => handleCreate(selectedDate)} disabled={creating}>
          {creating ? <Spinner size={14} /> : '+ Nouveau brouillon'}
        </button>
      </div>

      {sortedDates.map(date => {
        const items = mineOnly
          ? grouped[date].filter(b => b.auteur.id === user?.id)
          : grouped[date];
        if (items.length === 0) return null;
        return (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: 'var(--fg-muted)',
              marginBottom: 8, paddingLeft: 2,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {fmtDate(date)}
              {!mineOnly && (
                <span style={{ fontWeight: 400 }}>
                  · {items.length} brouillon{items.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {items.map(b => <BrouillonCard key={b.id} brouillon={b} onRefresh={load} />)}
          </div>
        );
      })}

      {/* FAB — mobile only */}
      <FabCreate
        fabRef={fabRef} fabOpen={fabOpen} setFabOpen={setFabOpen}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        onCreate={handleCreate} creating={creating}
      />
    </div>
  );
}

// ── FAB component ────────────────────────────────
interface FabProps {
  fabRef: React.RefObject<HTMLDivElement>;
  fabOpen: boolean;
  setFabOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  onCreate: (date: string) => void;
  creating: boolean;
}

function FabCreate({ fabRef, fabOpen, setFabOpen, selectedDate, setSelectedDate, onCreate, creating }: FabProps) {
  return (
    <div ref={fabRef}>
      {fabOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px) + 72px)',
          right: 20,
          background: 'var(--bg-card)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '12px 16px',
          zIndex: 50,
          minWidth: 220,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Date du dimanche
          </div>
          <input
            type="date"
            className="field"
            style={{ fontSize: 13, marginBottom: 10 }}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => onCreate(selectedDate)}
            disabled={creating}
          >
            {creating ? <Spinner size={14} /> : 'Créer le brouillon'}
          </button>
        </div>
      )}
      <button
        className="fab"
        onClick={() => setFabOpen(o => !o)}
        aria-label={fabOpen ? 'Fermer' : 'Créer un brouillon'}
        style={{ background: fabOpen ? 'var(--brand-brown)' : undefined }}
      >
        <span style={{
          display: 'inline-block',
          transform: fabOpen ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.2s',
          fontSize: 22, lineHeight: 1,
        }}>+</span>
      </button>
    </div>
  );
}

function IcoFileEmpty() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="12" y2="17"/>
    </svg>
  );
}
function IcoAlertCircle() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
