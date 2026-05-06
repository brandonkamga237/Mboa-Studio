import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getBrouillon, getCommentaires, updateBrouillon,
  soumettreCandidat, validerOfficiel, deleteBrouillon,
  renvoyerRevision, getBrouillons, setVisibilite,
} from '../api/client';
import { useAuthStore } from '../store/auth';
import { StatusPill } from '../components/ui/StatusPill';
import { Avatar } from '../components/ui/Avatar';
import { TimeAgo } from '../components/ui/TimeAgo';
import { ChantsList } from '../components/brouillon/ChantsList';
import { CommentThread } from '../components/commentaires/CommentThread';
import { Spinner } from '../components/ui/Spinner';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { Brouillon, BrouillonSummary, Commentaire } from '../types';
import { ETAPES_LABELS } from '../types';
import toast from 'react-hot-toast';

type TabId = 'chants' | 'liturgie' | 'lecon' | 'divers';
type Dialog =
  | { type: 'soumettre' }
  | { type: 'valider'; autreOfficiel: BrouillonSummary | null; loading: boolean }
  | { type: 'supprimer' }
  | null;

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BrouillonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('chants');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [liturgieText, setLiturgieText] = useState('');
  const [leconText, setLeconText] = useState('');
  const [diversText, setDiversText] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [showRenvoi, setShowRenvoi] = useState(false);
  const [motifRenvoi, setMotifRenvoi] = useState('');
  const [envoiRenvoi, setEnvoiRenvoi] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoadError(false);
    try {
      const [b, comms] = await Promise.all([
        getBrouillon(Number(id)),
        getCommentaires(Number(id)),
      ]);
      setBrouillon(b);
      setCommentaires(comms);
      setLiturgieText(b.liturgie);
      setLeconText(b.lecon);
      setDiversText(b.divers);
    } catch {
      setLoadError(true);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // useMemo doit être appelé avant tout early return (règle des hooks)
  const tabs = useMemo<{ id: TabId; label: string; count?: number }[]>(() => [
    { id: 'chants',   label: 'Chants',   count: brouillon?.chants.length ?? 0 },
    { id: 'liturgie', label: 'Liturgie' },
    { id: 'lecon',    label: 'Leçon' },
    { id: 'divers',   label: 'Divers' },
  ], [brouillon?.chants.length]);

  if (loadError) {
    return (
      <div className="empty-state" style={{ height: '50dvh' }}>
        <div className="empty-state-icon"><IcoAlertCircle /></div>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg-primary)', marginBottom: 4 }}>
          Impossible de charger ce brouillon
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }}>
          Il a peut-être été supprimé ou tu n'as pas accès.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>Retour</button>
          <button className="btn btn-primary btn-sm" onClick={load}>Réessayer</button>
        </div>
      </div>
    );
  }

  if (!brouillon || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
        <Spinner size={32} />
      </div>
    );
  }

  const isResp  = user.role === 'responsable' || user.role === 'admin';
  const isOwner = brouillon.auteur.id === user.id;
  const canEdit = brouillon.statut !== 'archive' &&
    (brouillon.statut === 'officiel' ? isResp : isOwner || isResp);

  // ── Handlers ──────────────────────────────────────

  const handleSaveText = async () => {
    setSaving(true);
    try {
      await updateBrouillon(brouillon.id, { liturgie: liturgieText, lecon: leconText, divers: diversText });
      toast.success('Modifications enregistrées.');
      setEditMode(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleSoumettre = async () => {
    setActing(true);
    try {
      await soumettreCandidat(brouillon.id);
      toast.success('Brouillon soumis pour validation.');
      setDialog(null);
      load();
    } catch {} finally { setActing(false); }
  };

  const openValider = async () => {
    setDialog({ type: 'valider', autreOfficiel: null, loading: true });
    try {
      const semaine = await getBrouillons({ date_dimanche: brouillon.date_dimanche, statut: 'officiel' });
      const autre = semaine.find(b => b.id !== brouillon.id) ?? null;
      setDialog({ type: 'valider', autreOfficiel: autre, loading: false });
    } catch {
      setDialog({ type: 'valider', autreOfficiel: null, loading: false });
    }
  };

  const handleValider = async () => {
    setActing(true);
    try {
      await validerOfficiel(brouillon.id);
      toast.success('Brouillon validé comme officiel.');
      setDialog(null);
      load();
    } catch {} finally { setActing(false); }
  };

  const handleDelete = async () => {
    setActing(true);
    try {
      await deleteBrouillon(brouillon.id);
      toast.success('Brouillon supprimé.');
      setDialog(null);
      navigate(-1);
    } catch {} finally { setActing(false); }
  };

  const handleRenvoyer = async () => {
    if (!motifRenvoi.trim()) {
      toast.error('Indique un motif de révision.');
      return;
    }
    setEnvoiRenvoi(true);
    try {
      await renvoyerRevision(brouillon.id, motifRenvoi);
      toast.success('Brouillon renvoyé en révision.');
      setShowRenvoi(false);
      setMotifRenvoi('');
      load();
    } catch {} finally { setEnvoiRenvoi(false); }
  };

  const handleToggleVisibilite = async () => {
    try {
      await setVisibilite(brouillon.id, !brouillon.visible);
      toast.success(brouillon.visible ? 'Brouillon masqué.' : 'Brouillon rendu visible.');
      load();
    } catch {}
  };

  const cancelEdit = () => {
    setEditMode(false);
    setLiturgieText(brouillon.liturgie);
    setLeconText(brouillon.lecon);
    setDiversText(brouillon.divers);
  };

  const bannerBg: Record<string, string> = {
    cree: '#F9FAFB', en_revision: '#FEF2F2',
    candidat_final: '#FFFBEB', officiel: '#F0FDF4', archive: '#F9FAFB',
  };
  const bannerBorder: Record<string, string> = {
    cree: '#E5E7EB', en_revision: '#FECACA',
    candidat_final: '#FDE68A', officiel: '#BBF7D0', archive: '#E5E7EB',
  };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Sticky header ─────────────────────────── */}
      <div className="sticky-below-topbar" style={{
        background: bannerBg[brouillon.statut] ?? '#F9FAFB',
        borderBottom: `2px solid ${bannerBorder[brouillon.statut] ?? '#E5E7EB'}`,
      }}>
        {/* Row 1 : auteur + statut */}
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar nom={brouillon.auteur.nom} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
              {brouillon.auteur.nom}
            </span>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginLeft: 6 }}>
              · <TimeAgo date={brouillon.modifie_le} />
            </span>
          </div>
          <StatusPill statut={brouillon.statut} />
        </div>

        {/* Row 2 : actions scrollables */}
        <div style={{
          display: 'flex', gap: 6, padding: '0 16px 10px',
          overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none',
        }}>
          <a href={`/api/brouillons/${brouillon.id}/pdf`} target="_blank" rel="noreferrer"
            className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', flexShrink: 0 }}
            aria-label="Télécharger PDF">
            <IcoPdf /> PDF
          </a>

          {canEdit && !editMode && (
            <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => setEditMode(true)}>
              <IcoPencil /> Modifier
            </button>
          )}
          {editMode && (
            <>
              <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={handleSaveText} disabled={saving}>
                {saving ? <Spinner size={12} /> : <><IcoCheck /> Enregistrer</>}
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={cancelEdit}>Annuler</button>
            </>
          )}

          {isOwner && brouillon.statut !== 'officiel' && brouillon.statut !== 'archive' && (
            <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={handleToggleVisibilite}>
              {brouillon.visible ? <><IcoEyeOff /> Masquer</> : <><IcoEye /> Rendre visible</>}
            </button>
          )}

          {isOwner && (brouillon.statut === 'cree' || brouillon.statut === 'en_revision') && (
            <button className="btn btn-gold btn-sm" style={{ flexShrink: 0 }} onClick={() => setDialog({ type: 'soumettre' })}>
              <IcoSend /> Soumettre
            </button>
          )}

          {isResp && (brouillon.statut === 'candidat_final' || brouillon.statut === 'cree') && (
            <>
              <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={openValider}>
                <IcoCheck /> Valider
              </button>
              <button className="btn btn-secondary btn-sm" style={{ color: '#DC2626', flexShrink: 0 }} onClick={() => setShowRenvoi(true)}>
                Renvoyer
              </button>
            </>
          )}

          {isOwner && (brouillon.statut === 'cree' || brouillon.statut === 'en_revision') && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: '#DC2626', flexShrink: 0 }}
              onClick={() => setDialog({ type: 'supprimer' })}
              aria-label="Supprimer ce brouillon"
            >
              <IcoTrash />
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="tab-bar" style={{ borderBottom: 'none', padding: '0 8px' }}>
          {tabs.map(t => (
            <div
              key={t.id}
              className={`tab-item${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
              role="tab"
              aria-selected={activeTab === t.id}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span style={{
                  background: activeTab === t.id ? 'var(--brand-navy)' : 'var(--border-medium)',
                  color: activeTab === t.id ? '#fff' : 'var(--fg-secondary)',
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                }}>
                  {t.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────── */}
      <div style={{ padding: '16px 16px 32px', maxWidth: 840 }}>

        {/* Bannière brouillon privé */}
        {!brouillon.visible && (
          <div style={{
            background: '#F3F4F6', border: '1px solid #E5E7EB',
            borderRadius: 8, padding: '8px 14px', marginBottom: 14,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <IcoEyeOff />
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              Ce brouillon est <strong>privé</strong> — seul toi peux le voir.
            </span>
          </div>
        )}

        {/* Bannière motif révision */}
        {brouillon.motif_revision && (
          <div style={{
            background: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 8, padding: '10px 14px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>↩</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>
                  Demande de modification — renvoyé en révision par un responsable
                </div>
                <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.55 }}>
                  {brouillon.motif_revision}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Chants ── */}
        {activeTab === 'chants' && (
          <div>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)', margin: '0 0 14px' }}>
              Programme des chants
            </h2>
            {canEdit ? (
              <ChantsList brouillon={brouillon} canEdit={canEdit} onRefresh={load} />
            ) : brouillon.chants.length > 0 ? (
              <div>
                {[...brouillon.chants].sort((a, b) => a.ordre - b.ordre).map((chant, i) => (
                  <div key={chant.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < brouillon.chants.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--bg-page)', border: '1px solid var(--border-medium)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)',
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chant.titre}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                        {ETAPES_LABELS[chant.etape] ?? chant.etape}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Aucun chant ajouté.</p>
            )}
            <CommentThread
              brouillonId={brouillon.id} cibleType="brouillon_bloc_chants" cibleId={brouillon.id}
              commentaires={commentaires} auteurBrouillonId={brouillon.auteur.id}
              onRefresh={load} label="Commenter les chants"
            />
          </div>
        )}

        {/* ── Tab: Liturgie ── */}
        {activeTab === 'liturgie' && (
          <div>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)', margin: '0 0 14px' }}>
              Liturgie
            </h2>
            {editMode ? (
              <textarea className="field" style={{ minHeight: 200, fontSize: 14, lineHeight: 1.7 }}
                value={liturgieText} onChange={e => setLiturgieText(e.target.value)}
                placeholder="Déroulé pédagogique, prières, transitions…" />
            ) : (
              <ReadBlock text={brouillon.liturgie} placeholder="Non renseignée." />
            )}
            <CommentThread brouillonId={brouillon.id} cibleType="brouillon_bloc_liturgie" cibleId={brouillon.id}
              commentaires={commentaires} auteurBrouillonId={brouillon.auteur.id} onRefresh={load} label="Commenter" />
            {editMode && <SaveBar onSave={handleSaveText} onCancel={cancelEdit} saving={saving} />}
          </div>
        )}

        {/* ── Tab: Leçon ── */}
        {activeTab === 'lecon' && (
          <div>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)', margin: '0 0 14px' }}>
              Leçon
            </h2>
            {editMode ? (
              <textarea className="field" style={{ minHeight: 200, fontSize: 14, lineHeight: 1.7 }}
                value={leconText} onChange={e => setLeconText(e.target.value)}
                placeholder="Contenu pédagogique pour les enfants…" />
            ) : (
              <ReadBlock text={brouillon.lecon} placeholder="Non renseignée." />
            )}
            <CommentThread brouillonId={brouillon.id} cibleType="brouillon_bloc_lecon" cibleId={brouillon.id}
              commentaires={commentaires} auteurBrouillonId={brouillon.auteur.id} onRefresh={load} label="Commenter" />
            {editMode && <SaveBar onSave={handleSaveText} onCancel={cancelEdit} saving={saving} />}
          </div>
        )}

        {/* ── Tab: Divers ── */}
        {activeTab === 'divers' && (
          <div>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)', margin: '0 0 14px' }}>
              Informations et divers
            </h2>
            {editMode ? (
              <textarea className="field" style={{ minHeight: 140, fontSize: 14, lineHeight: 1.7 }}
                value={diversText} onChange={e => setDiversText(e.target.value)}
                placeholder="Annonces, matériel nécessaire, anniversaires…" />
            ) : (
              <ReadBlock text={brouillon.divers} placeholder="Rien à signaler." />
            )}
            <CommentThread brouillonId={brouillon.id} cibleType="brouillon_bloc_divers" cibleId={brouillon.id}
              commentaires={commentaires} auteurBrouillonId={brouillon.auteur.id} onRefresh={load} label="Commenter" />
            {editMode && <SaveBar onSave={handleSaveText} onCancel={cancelEdit} saving={saving} />}
          </div>
        )}

        {/* Pied de page : date + validation */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.7 }}>
            Dimanche {fmtDate(brouillon.date_dimanche + 'T00:00:00')}
            {brouillon.validateur && (
              <>
                {' · '}Validé par <strong>{brouillon.validateur.nom}</strong>
                {brouillon.valide_le && (
                  <> le {fmtDate(brouillon.valide_le)}</>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── Dialogs ──────────────────────────────────── */}
      {dialog?.type === 'soumettre' && (
        <ConfirmModal
          title="Soumettre pour validation"
          message="Ce brouillon sera transmis au responsable pour relecture et validation."
          confirmLabel="Soumettre"
          variant="gold"
          loading={acting}
          onConfirm={handleSoumettre}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === 'valider' && (
        <ConfirmModal
          title="Valider ce brouillon"
          message={
            dialog.loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spinner size={14} /> Vérification en cours…
              </div>
            ) : dialog.autreOfficiel ? (
              <>
                Ce brouillon sera désigné comme <strong>officiel</strong> pour ce dimanche.
                <br /><br />
                <span style={{ color: '#92400E', background: '#FEF3C7', padding: '6px 10px', borderRadius: 6, display: 'block', fontSize: 13 }}>
                  ↩ Le brouillon de <strong>{dialog.autreOfficiel.auteur.nom}</strong> sera automatiquement archivé.
                </span>
              </>
            ) : (
              <>Ce brouillon sera désigné comme <strong>officiel</strong> pour ce dimanche.</>
            )
          }
          confirmLabel="Valider"
          variant="primary"
          loading={acting || dialog.loading}
          onConfirm={handleValider}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === 'supprimer' && (
        <ConfirmModal
          title="Supprimer ce brouillon"
          message={<>Cette action est <strong>irréversible</strong>. Le brouillon et tous ses chants seront définitivement supprimés.</>}
          confirmLabel="Supprimer définitivement"
          variant="danger"
          loading={acting}
          onConfirm={handleDelete}
          onCancel={() => setDialog(null)}
        />
      )}

      {showRenvoi && (
        <>
          <div className="overlay" onClick={() => { if (!envoiRenvoi) setShowRenvoi(false); }} />
          <div className="modal" style={{ maxWidth: 460 }}>
            <h3 style={{ fontFamily: 'Lora, serif', fontSize: 17, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 6 }}>
              Renvoyer en révision
            </h3>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Ce brouillon sera renvoyé à <strong>{brouillon.auteur.nom}</strong> avec ton retour.
            </p>
            <textarea
              className="field" style={{ minHeight: 90, fontSize: 14 }}
              placeholder="Ex : Il manque un chant pour la sortie…"
              value={motifRenvoi}
              onChange={e => setMotifRenvoi(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowRenvoi(false)} disabled={envoiRenvoi}>Annuler</button>
              <button className="btn btn-danger" onClick={handleRenvoyer} disabled={envoiRenvoi || !motifRenvoi.trim()}>
                {envoiRenvoi ? <Spinner size={14} /> : 'Renvoyer en révision'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SaveBar({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 16 }}>
      <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>Annuler</button>
      <button className="btn btn-primary" onClick={onSave} disabled={saving}>
        {saving ? <Spinner size={14} /> : 'Enregistrer'}
      </button>
    </div>
  );
}

function ReadBlock({ text, placeholder }: { text: string; placeholder: string }) {
  if (!text?.trim()) return <p style={{ fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic', margin: 0 }}>{placeholder}</p>;
  return <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--fg-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>;
}

function IcoPencil() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IcoCheck() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IcoSend() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
}
function IcoTrash() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
}
function IcoPdf() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function IcoEye() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function IcoEyeOff() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function IcoAlertCircle() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
