import { useState } from 'react';
import { addCommentaire } from '../../api/client';
import { Avatar } from '../ui/Avatar';
import { TimeAgo } from '../ui/TimeAgo';
import { Spinner } from '../ui/Spinner';
import type { Commentaire, CibleType } from '../../types';
import toast from 'react-hot-toast';

interface CommentThreadProps {
  brouillonId: number;
  cibleType: CibleType;
  cibleId: number;
  commentaires: Commentaire[];
  auteurBrouillonId: number;
  onRefresh: () => void;
  label?: string;
}

export function CommentThread({
  brouillonId, cibleType, cibleId, commentaires, onRefresh, label,
}: CommentThreadProps) {
  const [open, setOpen] = useState(false);
  const filtered = commentaires.filter(
    c => c.cible_type === cibleType && c.cible_id === cibleId && c.parent_id === null
  );

  return (
    <div style={{ marginTop: 10 }}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize: 11, color: 'var(--fg-muted)' }}
        onClick={() => setOpen(o => !o)}
      >
        <IcoMsg />
        {label || 'Commentaires'}
        {filtered.length > 0 && (
          <span style={{
            background: 'var(--brand-stone)', color: 'var(--fg-secondary)',
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, marginLeft: 2,
          }}>
            {filtered.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{ marginTop: 10, paddingLeft: 4 }}>
          {filtered.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 10, fontStyle: 'italic' }}>
              Aucun commentaire pour l'instant.
            </p>
          )}
          {filtered.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              brouillonId={brouillonId}
              cibleType={cibleType}
              cibleId={cibleId}
              onRefresh={onRefresh}
              depth={0}
            />
          ))}
          <CommentForm
            brouillonId={brouillonId}
            cibleType={cibleType}
            cibleId={cibleId}
            onRefresh={onRefresh}
            placeholder="Ajouter un commentaire…"
          />
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Commentaire;
  brouillonId: number;
  cibleType: CibleType;
  cibleId: number;
  onRefresh: () => void;
  depth: number;
}

function CommentItem({ comment, brouillonId, cibleType, cibleId, onRefresh, depth }: CommentItemProps) {
  const [replying, setReplying] = useState(false);

  return (
    <div style={{
      marginLeft: depth > 0 ? 20 : 0,
      borderLeft: depth > 0 ? '2px solid var(--border-subtle)' : 'none',
      paddingLeft: depth > 0 ? 12 : 0,
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Avatar nom={comment.auteur.nom} size={24} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)' }}>
              {comment.auteur.nom}
            </span>
            <TimeAgo date={comment.cree_le} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg-primary)', lineHeight: 1.55, margin: 0 }}>
            {comment.contenu}
          </p>
          {depth < 3 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, marginTop: 4, color: 'var(--fg-muted)' }}
              onClick={() => setReplying(r => !r)}
            >
              {replying ? 'Annuler' : 'Répondre'}
            </button>
          )}
        </div>
      </div>

      {replying && (
        <div style={{ marginLeft: 32, marginTop: 8 }}>
          <CommentForm
            brouillonId={brouillonId}
            cibleType={cibleType}
            cibleId={cibleId}
            parentId={comment.id}
            onRefresh={() => { setReplying(false); onRefresh(); }}
            placeholder={`Répondre à ${comment.auteur.nom}…`}
          />
        </div>
      )}

      {comment.reponses?.map(r => (
        <CommentItem
          key={r.id}
          comment={r}
          brouillonId={brouillonId}
          cibleType={cibleType}
          cibleId={cibleId}
          onRefresh={onRefresh}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

interface CommentFormProps {
  brouillonId: number;
  cibleType: CibleType;
  cibleId: number;
  parentId?: number;
  onRefresh: () => void;
  placeholder?: string;
}

function CommentForm({ brouillonId, cibleType, cibleId, parentId, onRefresh, placeholder }: CommentFormProps) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addCommentaire(brouillonId, {
        contenu: text.trim(),
        cible_type: cibleType,
        cible_id: cibleId,
        parent_id: parentId,
      });
      setText('');
      onRefresh();
    } catch {
      toast.error('Impossible d\'envoyer le commentaire.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 6 }}>
      <textarea
        className="field"
        style={{ flex: 1, minHeight: 60, fontSize: 13, padding: '8px 10px' }}
        placeholder={placeholder}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
      />
      <button
        className="btn btn-primary btn-sm"
        onClick={submit}
        disabled={saving || !text.trim()}
        style={{ flexShrink: 0 }}
      >
        {saving ? <Spinner size={12} /> : 'Envoyer'}
      </button>
    </div>
  );
}

function IcoMsg() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginRight: 3 }}>
      <path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z"/>
    </svg>
  );
}
