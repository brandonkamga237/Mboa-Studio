import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBrouillons, getHistorique, dupliquerBrouillon, createBrouillon } from '../api/client';
import { useAuthStore } from '../store/auth';
import { StatusPill } from '../components/ui/StatusPill';
import { Spinner } from '../components/ui/Spinner';
import type { BrouillonSummary } from '../types';
import toast from 'react-hot-toast';

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getUpcomingSundays(): [string, string] {
  const d = new Date();
  const day = d.getDay();
  const d1 = new Date(d);
  d1.setDate(d.getDate() + (day === 0 ? 7 : 7 - day));
  const d2 = new Date(d1);
  d2.setDate(d1.getDate() + 7);
  return [localDateStr(d1), localDateStr(d2)];
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function fmtLong(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function fmtShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isResp = user?.role === 'responsable' || user?.role === 'admin';
  const [dimanche1, dimanche2] = getUpcomingSundays();
  const jours1 = daysUntil(dimanche1);

  const [brouillons1, setBrouillons1] = useState<BrouillonSummary[]>([]);
  const [brouillons2, setBrouillons2] = useState<BrouillonSummary[]>([]);
  const [historique, setHistorique] = useState<BrouillonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const [sem1, sem2, hist] = await Promise.all([
          getBrouillons({ date_dimanche: dimanche1 }),
          getBrouillons({ date_dimanche: dimanche2 }),
          getHistorique(),
        ]);
        setBrouillons1(sem1);
        setBrouillons2(sem2);
        setHistorique(hist.slice(0, 5));
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dimanche1, dimanche2]);

  const handleCreate = async (date: string) => {
    setCreating(date);
    try {
      const b = await createBrouillon({ date_dimanche: date });
      navigate(`/brouillons/${b.id}`);
    } catch {} finally { setCreating(null); }
  };

  const handleDupliquer = async (sourceId: number, targetDate: string) => {
    try {
      const b = await dupliquerBrouillon(sourceId, targetDate);
      toast.success('Brouillon dupliqué.');
      navigate(`/brouillons/${b.id}`);
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50dvh' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-wrapper">
        <div className="empty-state" style={{ paddingTop: 48 }}>
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg-primary)', marginBottom: 4 }}>
            Impossible de charger le tableau de bord
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }}>
            Vérifie ta connexion puis réessaie.
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  const monBrouillon1 = brouillons1.find(b => b.auteur.id === user?.id);
  const monBrouillon2 = brouillons2.find(b => b.auteur.id === user?.id);
  const candidats1 = brouillons1.filter(b => b.statut === 'candidat_final');
  const candidats2 = brouillons2.filter(b => b.statut === 'candidat_final');
  const officiel1 = brouillons1.find(b => b.statut === 'officiel');
  const officiel2 = brouillons2.find(b => b.statut === 'officiel');
  const prenom = user?.nom.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="page-wrapper">

      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>
          Bonjour{prenom ? `, ${prenom}` : ''}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 3 }}>
          {jours1 === 0 ? "C'est dimanche aujourd'hui !" : jours1 === 1 ? "Demain c'est le culte." : `Prochain culte dans ${jours1} jours`}
        </p>
      </div>

      {/* Alerte responsable */}
      {isResp && (candidats1.length > 0 || candidats2.length > 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--brand-gold-pale)', border: '1px solid #FDE68A',
          borderRadius: 10, padding: '11px 14px', marginBottom: 16,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⏳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>En attente de validation</div>
            <div style={{ fontSize: 12, color: '#B45309', marginTop: 1 }}>
              {[
                candidats1.length > 0 && `${candidats1.length} brouillon${candidats1.length > 1 ? 's' : ''} pour ${fmtShort(dimanche1)}`,
                candidats2.length > 0 && `${candidats2.length} pour ${fmtShort(dimanche2)}`,
              ].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button className="btn btn-sm" style={{ background: '#D97706', color: '#fff', flexShrink: 0 }}
            onClick={() => navigate('/brouillons')}>
            Voir
          </button>
        </div>
      )}

      {/* Hero : prochain dimanche */}
      <div className="hero-card" style={{ marginBottom: 12 }}>
        <div className="hero-card-header">
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-muted)', marginBottom: 3 }}>
              Prochain dimanche
            </div>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 600, color: 'var(--fg-primary)' }}>
              {fmtLong(dimanche1)}
            </div>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
            background: jours1 <= 2 ? '#FEE2E2' : 'var(--brand-stone)',
            color: jours1 <= 2 ? '#DC2626' : 'var(--fg-secondary)',
            flexShrink: 0,
          }}>
            {jours1 === 0 ? "Aujourd'hui" : jours1 === 1 ? 'Demain' : `J-${jours1}`}
          </span>
        </div>

        <div className="hero-card-body">
          {officiel1 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✅</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#14532D' }}>Brouillon validé</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                    par {officiel1.auteur.nom} · {officiel1.nb_chants} chant{officiel1.nb_chants !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/brouillons/${officiel1.id}`)}>Consulter</button>
                <a href={`/api/brouillons/${officiel1.id}/pdf`} target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                  Télécharger PDF
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-page)', border: '2px dashed var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IcoFile />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                  {brouillons1.length === 0 ? 'Aucun brouillon proposé' : `${brouillons1.length} brouillon${brouillons1.length > 1 ? 's' : ''} en cours`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Pas encore de brouillon validé</div>
              </div>
            </div>
          )}
        </div>

        <div className="hero-card-footer">
          {monBrouillon1 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--fg-secondary)', fontWeight: 500 }}>Mon brouillon</span>
                <StatusPill statut={monBrouillon1.statut} />
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}
                onClick={() => navigate(`/brouillons/${monBrouillon1.id}`)}>
                Ouvrir →
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Pas encore de brouillon pour toi</span>
              <button className="btn btn-primary btn-sm" onClick={() => handleCreate(dimanche1)} disabled={creating === dimanche1}>
                {creating === dimanche1 ? <Spinner size={12} /> : '+ Créer'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dimanche suivant */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Dimanche suivant
            </div>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)' }}>
              {fmtLong(dimanche2)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
              {brouillons2.length === 0 ? 'Aucun brouillon' : `${brouillons2.length} brouillon${brouillons2.length > 1 ? 's' : ''}`}
              {officiel2 && <span style={{ color: '#16A34A', marginLeft: 6, fontWeight: 600 }}>· Validé</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            {officiel2 ? (
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/brouillons/${officiel2.id}`)}>Consulter</button>
            ) : monBrouillon2 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusPill statut={monBrouillon2.statut} />
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/brouillons/${monBrouillon2.id}`)}>→</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleCreate(dimanche2)} disabled={creating === dimanche2}>
                  {creating === dimanche2 ? <Spinner size={12} /> : '+ Créer'}
                </button>
                {historique.length > 0 && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}
                    onClick={() => handleDupliquer(historique[0].id, dimanche2)}>
                    Partir du dernier →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historique récent */}
      {historique.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-muted)' }}>
              Historique
            </span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => navigate('/historique')}>
              Tout voir
            </button>
          </div>
          {historique.map((h, i) => (
            <div key={h.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: i < historique.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              cursor: 'pointer',
            }} onClick={() => navigate(`/brouillons/${h.id}`)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)' }}>
                  {new Date(h.date_dimanche + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                  {h.auteur.nom} · {h.nb_chants} chant{h.nb_chants !== 1 ? 's' : ''}
                </div>
              </div>
              <a href={`/api/brouillons/${h.id}/pdf`} target="_blank" rel="noreferrer"
                className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', fontSize: 11 }}
                onClick={e => e.stopPropagation()}>
                PDF ↓
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IcoFile() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
