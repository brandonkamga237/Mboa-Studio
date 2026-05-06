import { useState } from 'react';
import { addChant, deleteChant, updateChant, reorderChants } from '../../api/client';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { Brouillon, Chant, Etape } from '../../types';
import { ETAPES_LABELS } from '../../types';
import toast from 'react-hot-toast';

const ETAPES = Object.keys(ETAPES_LABELS) as Etape[];

interface ChantsListProps {
  brouillon: Brouillon;
  canEdit: boolean;
  onRefresh: () => void;
}

export function ChantsList({ brouillon, canEdit, onRefresh }: ChantsListProps) {
  const [adding, setAdding] = useState(false);
  const [newTitre, setNewTitre] = useState('');
  const [newEtape, setNewEtape] = useState<Etape>('salutation');
  const [saving, setSaving] = useState(false);
  const [chantASupprimer, setChantASupprimer] = useState<Chant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState<number | null>(null);

  const sorted = [...brouillon.chants].sort((a, b) => a.ordre - b.ordre);

  const handleAdd = async () => {
    if (!newTitre.trim()) return;
    setSaving(true);
    try {
      await addChant(brouillon.id, {
        titre: newTitre.trim(),
        etape: newEtape,
        ordre: sorted.length + 1,
      });
      setNewTitre('');
      setNewEtape('salutation');
      setAdding(false);
      onRefresh();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!chantASupprimer) return;
    setDeleting(true);
    try {
      await deleteChant(brouillon.id, chantASupprimer.id);
      toast.success('Chant supprimé.');
      setChantASupprimer(null);
      onRefresh();
    } catch {} finally { setDeleting(false); }
  };

  const handleMove = async (chantId: number, direction: 'up' | 'down') => {
    const idx = sorted.findIndex(c => c.id === chantId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const newOrder = [...sorted];
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swap]] = [newOrder[swap], newOrder[idx]];
    setMoving(chantId);
    try {
      await reorderChants(brouillon.id, newOrder.map(c => c.id));
      onRefresh();
    } catch {} finally { setMoving(null); }
  };

  return (
    <div>
      {sorted.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 12 }}>
          Aucun chant renseigné.
        </p>
      )}

      {sorted.length > 0 && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--brand-navy)', color: '#FDFAF7' }}>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, fontSize: 11, width: 36 }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, width: 160 }}>Étape</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Titre du chant</th>
                {canEdit && <th style={{ width: 80 }} />}
              </tr>
            </thead>
            <tbody>
              {sorted.map((chant, i) => (
                <ChantRow
                  key={chant.id}
                  chant={chant}
                  idx={i}
                  total={sorted.length}
                  brouillonId={brouillon.id}
                  canEdit={canEdit}
                  onDelete={() => setChantASupprimer(chant)}
                  onMoveUp={() => handleMove(chant.id, 'up')}
                  onMoveDown={() => handleMove(chant.id, 'down')}
                  onRefresh={onRefresh}
                  bg={i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-page)'}
                  isMoving={moving === chant.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && !adding && (
        <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>
          + Ajouter un chant
        </button>
      )}

      {canEdit && adding && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <select
            className="field"
            style={{ width: 'auto', fontSize: 13 }}
            value={newEtape}
            onChange={e => setNewEtape(e.target.value as Etape)}
          >
            {ETAPES.map(e => <option key={e} value={e}>{ETAPES_LABELS[e]}</option>)}
          </select>
          <input
            className="field"
            style={{ flex: 1, minWidth: 180, fontSize: 13 }}
            placeholder="Titre du chant"
            value={newTitre}
            onChange={e => setNewTitre(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving || !newTitre.trim()}>
            Ajouter
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Annuler</button>
        </div>
      )}

      {chantASupprimer && (
        <ConfirmModal
          title="Supprimer le chant"
          message={<>Supprimer <strong>« {chantASupprimer.titre} »</strong> de la liste ?</>}
          confirmLabel="Supprimer"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setChantASupprimer(null)}
        />
      )}
    </div>
  );
}

interface ChantRowProps {
  chant: Chant;
  idx: number;
  total: number;
  brouillonId: number;
  canEdit: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRefresh: () => void;
  bg: string;
  isMoving: boolean;
}

function ChantRow({ chant, idx, total, brouillonId, canEdit, onDelete, onMoveUp, onMoveDown, onRefresh, bg, isMoving }: ChantRowProps) {
  const [editing, setEditing] = useState(false);
  const [titre, setTitre] = useState(chant.titre);
  const [etape, setEtape] = useState<Etape>(chant.etape);

  const save = async () => {
    try {
      await updateChant(brouillonId, chant.id, { titre: titre.trim(), etape });
      setEditing(false);
      onRefresh();
    } catch {}
  };

  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--fg-muted)', padding: '2px 4px',
    opacity: isMoving ? 0.4 : 1,
  };

  if (editing) {
    return (
      <tr style={{ background: '#FFFBEB' }}>
        <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 11, fontWeight: 700 }}>
          {idx + 1}
        </td>
        <td style={{ padding: '6px 8px' }}>
          <select className="field" style={{ fontSize: 12, padding: '4px 6px' }}
            value={etape} onChange={e => setEtape(e.target.value as Etape)}>
            {ETAPES.map(e => <option key={e} value={e}>{ETAPES_LABELS[e]}</option>)}
          </select>
        </td>
        <td style={{ padding: '6px 8px' }}>
          <input className="field" style={{ fontSize: 12, padding: '4px 6px' }}
            value={titre} onChange={e => setTitre(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus />
        </td>
        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
          <button className="btn btn-primary btn-sm" onClick={save} style={{ marginRight: 4 }}>OK</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>✕</button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ background: bg, opacity: isMoving ? 0.6 : 1, transition: 'opacity 150ms' }}>
      <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 11, fontWeight: 700 }}>
        {idx + 1}
      </td>
      <td style={{ padding: '8px 12px', color: 'var(--fg-secondary)', fontSize: 12 }}>
        {ETAPES_LABELS[chant.etape] ?? chant.etape}
      </td>
      <td style={{ padding: '8px 12px', color: 'var(--fg-primary)' }}>{chant.titre}</td>
      {canEdit && (
        <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
          <button onClick={onMoveUp} disabled={idx === 0 || isMoving} title="Monter" style={{ ...btnStyle, opacity: idx === 0 ? 0.2 : 1 }}>
            <IcoUp />
          </button>
          <button onClick={onMoveDown} disabled={idx === total - 1 || isMoving} title="Descendre" style={{ ...btnStyle, opacity: idx === total - 1 ? 0.2 : 1 }}>
            <IcoDown />
          </button>
          <button onClick={() => setEditing(true)} title="Modifier" style={btnStyle}>
            <IcoEdit />
          </button>
          <button onClick={onDelete} title="Supprimer" style={{ ...btnStyle, color: '#DC2626' }}>
            <IcoTrash />
          </button>
        </td>
      )}
    </tr>
  );
}

function IcoUp() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 8 6 4 10 8"/></svg>;
}
function IcoDown() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 4 6 8 10 4"/></svg>;
}
function IcoEdit() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg>;
}
function IcoTrash() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="3 6 4 14 12 14 13 6"/><path d="M2 4h12"/><path d="M7 4V2h2v2"/></svg>;
}
