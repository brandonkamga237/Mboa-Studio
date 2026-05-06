import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { StatusPill } from '../ui/StatusPill';
import { TimeAgo } from '../ui/TimeAgo';
import type { BrouillonSummary } from '../../types';
import { getPdfUrl } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { validerOfficiel, soumettreCandidat } from '../../api/client';
import toast from 'react-hot-toast';

interface BrouillonCardProps {
  brouillon: BrouillonSummary;
  onRefresh?: () => void;
}

export function BrouillonCard({ brouillon, onRefresh }: BrouillonCardProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isResp = user?.role === 'responsable' || user?.role === 'admin';
  const isAuteur = user?.id === brouillon.auteur.id;

  const handleSoumettre = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await soumettreCandidat(brouillon.id);
      toast.success('Brouillon soumis comme candidat final.');
      onRefresh?.();
    } catch {}
  };

  const handleValider = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await validerOfficiel(brouillon.id);
      toast.success('Brouillon désigné comme officiel.');
      onRefresh?.();
    } catch {}
  };

  const isOfficiel = brouillon.statut === 'officiel';

  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        marginBottom: 10,
        borderLeft: isOfficiel ? '3px solid #16A34A' : '3px solid transparent',
        transition: 'box-shadow 0.15s',
      }}
      onClick={() => navigate(`/brouillons/${brouillon.id}`)}
    >
      {/* Row 1: Avatar + name + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar nom={brouillon.auteur.nom} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)', whiteSpace: 'nowrap' }}>
              {brouillon.auteur.nom.split(' ')[0]}
            </span>
            {isAuteur && !brouillon.visible && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999,
                background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB',
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                <IcoEyeOff /> Privé
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 1 }}>
            Modifié <TimeAgo date={brouillon.modifie_le} />
          </div>
        </div>
        <StatusPill statut={brouillon.statut} />
      </div>

      {/* Row 2: Stats + lecon preview */}
      <div style={{ marginTop: 10, marginLeft: 44 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
          {brouillon.nb_chants} chant{brouillon.nb_chants !== 1 ? 's' : ''}
          {brouillon.nb_commentaires > 0 && (
            <> · <span style={{ color: '#D97706' }}>{brouillon.nb_commentaires} commentaire{brouillon.nb_commentaires !== 1 ? 's' : ''}</span></>
          )}
        </div>
        {brouillon.apercu_lecon && (
          <div style={{
            fontSize: 12, color: 'var(--fg-muted)', marginTop: 4, fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {brouillon.apercu_lecon}
          </div>
        )}
      </div>

      {/* Row 3: Actions (only if relevant) */}
      {(isAuteur || isResp) && (
        <div
          style={{ display: 'flex', gap: 6, marginTop: 10, marginLeft: 44 }}
          onClick={e => e.stopPropagation()}
        >
          {brouillon.statut !== 'archive' && (
            <a
              href={getPdfUrl(brouillon.id)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ textDecoration: 'none', fontSize: 11, color: 'var(--fg-secondary)' }}
            >
              PDF ↓
            </a>
          )}
          {isAuteur && brouillon.statut === 'cree' && (
            <button className="btn btn-gold btn-sm" style={{ fontSize: 11 }} onClick={handleSoumettre}>
              Soumettre
            </button>
          )}
          {isResp && (brouillon.statut === 'candidat_final' || brouillon.statut === 'cree') && (
            <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }} onClick={handleValider}>
              {brouillon.statut === 'candidat_final' ? 'Valider officiel' : 'Désigner officiel'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function IcoEyeOff() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
