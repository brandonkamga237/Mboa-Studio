// Mises en Commun — Brouillon Editor Screen
// ui_kits/app/Brouillon.jsx

const { useState } = React;

const ETAPES = [
  'Salutation','Adoration','Prière de repentance','Parole de grâce',
  'Loi','Leçon','Confession de foi','Offrande 1','Offrande 2','Sortie'
];

const SAMPLE_CHANTS = [
  { id:1, titre: 'Gloire à Dieu dans les cieux', etape: 'Salutation' },
  { id:2, titre: 'Saint, Saint, Saint', etape: 'Adoration' },
  { id:3, titre: 'Seigneur, aie pitié', etape: 'Prière de repentance' },
  { id:4, titre: 'Ô combien j\'aime Jésus', etape: 'Leçon' },
  { id:5, titre: 'Louange et gloire', etape: 'Sortie' },
];

const SAMPLE_COMMENTS = [
  {
    id: 1, author: 'Paul', time: 'Sam. 10h14', text: 'Ce chant est trop solennel pour les petits, je propose "Mon Dieu est si grand".',
    replies: [
      { id: 2, author: 'Esther', time: 'Sam. 10h22', text: 'D\'accord, mais "Mon Dieu est si grand" on l\'a déjà fait dimanche dernier.', resolved: false },
      { id: 3, author: 'Paul', time: 'Sam. 10h31', text: 'Tu as raison. Que penses-tu de "Quel ami fidèle et tendre" ?', resolved: true },
    ]
  }
];

function CommentThread({ comments, onClose }) {
  const [newComment, setNewComment] = useState('');
  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 300,
      background: '#FDFAF7', borderLeft: '1px solid #D1C9BE',
      display: 'flex', flexDirection: 'column', zIndex: 10
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8E2D9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>Commentaires</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {comments.map(c => (
          <div key={c.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <Avatar name={c.author} size={24} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)', fontFamily: 'var(--font-body)' }}>{c.author}</span>
                  <span style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)' }}>{c.time}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--fg-secondary)', margin: '3px 0 0', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>{c.text}</p>
              </div>
            </div>
            {c.replies && c.replies.map(r => (
              <div key={r.id} style={{ marginLeft: 32, paddingLeft: 10, borderLeft: '2px solid #E8E2D9', marginBottom: 6, opacity: r.resolved ? 0.55 : 1 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 2, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-primary)', fontFamily: 'var(--font-body)' }}>{r.author}</span>
                  <span style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)' }}>{r.time}</span>
                  {r.resolved && <span style={{ fontSize: 10, color: '#15803D', fontWeight: 600 }}>✓ Résolu</span>}
                </div>
                <p style={{ fontSize: 12, color: 'var(--fg-secondary)', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>{r.text}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #E8E2D9' }}>
        <textarea
          value={newComment} onChange={e => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire…"
          style={{
            width: '100%', padding: '8px 10px', border: '1px solid #D1C9BE', borderRadius: 6,
            fontFamily: 'var(--font-body)', fontSize: 12, resize: 'none', height: 60,
            color: 'var(--fg-primary)', background: 'white', boxSizing: 'border-box'
          }}
        />
        <Btn variant="primary" size="sm" style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}>
          Envoyer
        </Btn>
      </div>
    </div>
  );
}

function ChantRow({ chant, index, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', background: 'var(--bg-page)',
      borderRadius: 6, border: '1px solid var(--border-subtle)',
      marginBottom: 6
    }}>
      <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', minWidth: 20 }}>{index + 1}</span>
      <input
        defaultValue={chant.titre}
        style={{
          flex: 1, border: 'none', background: 'transparent',
          fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--fg-primary)', outline: 'none'
        }}
        placeholder="Titre du chant…"
      />
      <select
        defaultValue={chant.etape}
        style={{
          border: '1px solid var(--border-medium)', borderRadius: 5, padding: '3px 8px',
          fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-secondary)',
          background: 'white', cursor: 'pointer'
        }}
      >
        {ETAPES.map(e => <option key={e}>{e}</option>)}
      </select>
      <button onClick={() => onDelete(chant.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
    </div>
  );
}

function Brouillon({ onNavigate, userRole = 'moniteur', status = 'cree', isOwner = true }) {
  const [tab, setTab] = useState('chants');
  const [chants, setChants] = useState(SAMPLE_CHANTS);
  const [showComments, setShowComments] = useState(false);
  const [liturgie, setLiturgie] = useState('La liturgie commence par l\'accueil des enfants. Le moniteur principal lit la salutation liturgique tirée de Romains 1:7, puis invite l\'assemblée à chanter...');
  const [lecon, setLecon] = useState('Texte de base : Josué 3 — Le passage du Jourdain\n\nObjectif : Comprendre que Dieu tient ses promesses, même quand la situation semble impossible.\n\nPoints clés :\n1. Dieu demande d\'agir par la foi avant de voir le miracle\n2. Le souvenir des actes de Dieu nous aide à lui faire confiance\n3. Application : Dans quelles situations difficiles pouvons-nous faire confiance à Dieu ?');
  const [divers, setDivers] = useState('• Anniversaire de Lucas (6 ans) — prévoir un temps de prière\n• Apporter les feuilles de coloriage pour les tout-petits\n• Rappel : la réunion des moniteurs est avancée au vendredi prochain');

  const tabs = ['chants', 'liturgie', 'lecon', 'divers'];
  const tabLabels = { chants: 'Chants', liturgie: 'Liturgie', lecon: 'Leçon', divers: 'Divers' };
  const commentCounts = { chants: 1, liturgie: 0, lecon: 0, divers: 0 };

  const statusBorderMap = { cree: '#9CA3AF', candidat: '#D97706', officiel: '#15803D', archive: '#D1D5DB' };

  function addChant() {
    const newId = Math.max(...chants.map(c => c.id)) + 1;
    setChants([...chants, { id: newId, titre: '', etape: 'Adoration' }]);
  }

  function deleteChant(id) {
    setChants(chants.filter(c => c.id !== id));
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Top bar */}
      <div style={{
        padding: '0 32px', background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0
      }}>
        {/* Breadcrumb + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => onNavigate('week-drafts')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-link)', fontSize: 13, fontFamily: 'var(--font-body)', padding: 0 }}>
              Brouillons de la semaine
            </button>
            <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>›</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--fg-primary)' }}>
              Brouillon de Marie
            </span>
            <StatusPill status={status} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isOwner && status === 'cree' && (
              <Btn variant="secondary" size="sm">Soumettre comme candidat</Btn>
            )}
            {(userRole === 'responsable' || userRole === 'admin') && status === 'candidat' && (
              <Btn variant="gold" size="sm"><IconCheck /> Désigner comme officiel</Btn>
            )}
            {status === 'officiel' && (
              <Btn variant="secondary" size="sm"><IconDownload /> Télécharger le PDF</Btn>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                borderBottom: tab === t ? '2px solid #1E2D4A' : '2px solid transparent',
                transition: 'color 150ms ease', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              {tabLabels[t]}
              {commentCounts[t] > 0 && (
                <span style={{ background: '#FDE68A', color: '#92400E', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>
                  {commentCounts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content + comment panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {/* Chants tab */}
          {tab === 'chants' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>Chants</h2>
                  <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '3px 0 0', fontFamily: 'var(--font-body)' }}>{chants.length} chant{chants.length > 1 ? 's' : ''} · Glisser pour réordonner</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                    <IconMessage /> Commenter ({commentCounts.chants})
                  </Btn>
                  {isOwner && <Btn variant="secondary" size="sm" onClick={addChant}><IconPlus /> Ajouter</Btn>}
                </div>
              </div>
              <div>
                {chants.map((c, i) => (
                  <ChantRow key={c.id} chant={c} index={i} onDelete={deleteChant} />
                ))}
              </div>
            </div>
          )}

          {/* Text tabs */}
          {(tab === 'liturgie' || tab === 'lecon' || tab === 'divers') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>
                  {tabLabels[tab]}
                </h2>
                <Btn variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                  <IconMessage /> Commenter
                </Btn>
              </div>
              <textarea
                value={tab === 'liturgie' ? liturgie : tab === 'lecon' ? lecon : divers}
                onChange={e => {
                  if (tab === 'liturgie') setLiturgie(e.target.value);
                  else if (tab === 'lecon') setLecon(e.target.value);
                  else setDivers(e.target.value);
                }}
                disabled={!isOwner}
                placeholder={`Contenu de la ${tabLabels[tab].toLowerCase()}…`}
                style={{
                  width: '100%', minHeight: 260, padding: '14px 16px',
                  border: '1px solid var(--border-medium)', borderRadius: 8,
                  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65,
                  color: 'var(--fg-primary)', background: isOwner ? 'white' : 'var(--bg-page)',
                  resize: 'vertical', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Comment panel */}
        {showComments && (
          <CommentThread comments={SAMPLE_COMMENTS} onClose={() => setShowComments(false)} />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Brouillon });
