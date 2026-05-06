// Mises en Commun — Week Drafts List Screen
// ui_kits/app/BrouillonList.jsx

const { useState } = React;

const DRAFTS = [
  {
    id: 1, author: 'Marie', status: 'cree',
    modified: 'il y a 2h', chants: 8, comments: 3, isMe: true,
    lesson: 'Josué et la terre promise'
  },
  {
    id: 2, author: 'Paul', status: 'candidat',
    modified: 'hier', chants: 10, comments: 1, isMe: false,
    lesson: 'Le passage du Jourdain'
  },
  {
    id: 3, author: 'Esther', status: 'cree',
    modified: 'il y a 3j', chants: 5, comments: 0, isMe: false,
    lesson: 'Dieu tient ses promesses'
  },
  {
    id: 4, author: 'Jean', status: 'cree',
    modified: 'il y a 4j', chants: 7, comments: 2, isMe: false,
    lesson: 'La foi en action'
  },
];

const borderColors = {
  cree: '#9CA3AF', candidat: '#D97706', officiel: '#15803D', archive: '#D1D5DB'
};

function BrouillonList({ onNavigate, onOpenDraft, userRole = 'moniteur' }) {
  const isResp = userRole === 'responsable' || userRole === 'admin';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>
            Brouillons de la semaine
          </h1>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>
            Dimanche 11 mai 2025 · {DRAFTS.length} brouillons proposés
          </p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => onOpenDraft && onOpenDraft('new')}>
          <IconPlus /> Créer un brouillon
        </Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DRAFTS.map(draft => (
          <div
            key={draft.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderLeft: `4px solid ${borderColors[draft.status]}`,
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16
            }}
          >
            <Avatar name={draft.author} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)' }}>
                  Brouillon de {draft.author}
                  {draft.isMe && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>(moi)</span>}
                </span>
                <StatusPill status={draft.status} />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)' }}>
                  Modifié {draft.modified}
                </span>
                <span style={{ fontSize: 12, color: 'var(--fg-secondary)', fontFamily: 'var(--font-body)' }}>
                  <IconMusic /> {draft.chants} chants
                </span>
                <span style={{ fontSize: 12, color: 'var(--fg-secondary)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <IconMessage /> {draft.comments} commentaire{draft.comments !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                  {draft.lesson}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Btn variant="secondary" size="sm" onClick={() => onOpenDraft && onOpenDraft(draft)}>
                Lire
              </Btn>
              {!draft.isMe && (
                <Btn variant="ghost" size="sm" onClick={() => onOpenDraft && onOpenDraft(draft)}>
                  <IconMessage /> Commenter
                </Btn>
              )}
              {isResp && draft.status === 'candidat' && (
                <Btn variant="gold" size="sm">
                  <IconCheck /> Valider
                </Btn>
              )}
              {draft.isMe && draft.status === 'cree' && (
                <Btn variant="secondary" size="sm">
                  Modifier
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { BrouillonList });
