// Mises en Commun — Historique Screen
// ui_kits/app/Historique.jsx

const { useState } = React;

const HISTORY = [
  { date: '4 mai 2025',   author: 'Esther',  validator: 'Jean-Marc', chants: 10, lesson: 'Josué et la terre promise',      hasOfficial: true },
  { date: '27 avr. 2025', author: 'Paul',    validator: 'Jean-Marc', chants: 9,  lesson: 'La foi d\'Abraham',               hasOfficial: true },
  { date: '20 avr. 2025', author: null,      validator: null,        chants: 0,  lesson: null,                              hasOfficial: false },
  { date: '13 avr. 2025', author: 'Marie',   validator: 'Sophie',   chants: 10, lesson: 'Pâques — La résurrection',        hasOfficial: true },
  { date: '6 avr. 2025',  author: 'Esther',  validator: 'Jean-Marc', chants: 8,  lesson: 'Les rameaux et l\'entrée à Jérusalem', hasOfficial: true },
  { date: '30 mars 2025', author: 'Paul',    validator: 'Sophie',   chants: 10, lesson: 'La prière du Seigneur',           hasOfficial: true },
  { date: '23 mars 2025', author: 'Jean',    validator: 'Jean-Marc', chants: 7,  lesson: 'David et Goliath',               hasOfficial: true },
];

function Historique({ onNavigate }) {
  const [query, setQuery] = useState('');

  const filtered = HISTORY.filter(h => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      h.date.toLowerCase().includes(q) ||
      (h.author && h.author.toLowerCase().includes(q)) ||
      (h.lesson && h.lesson.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>
          Historique
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>
          Tous les brouillons officiels passés, dimanche après dimanche.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24, maxWidth: 480 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
          <IconSearch />
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Chercher par date, chant, leçon, auteur…"
          style={{
            width: '100%', padding: '9px 12px 9px 36px',
            border: '1px solid var(--border-medium)', borderRadius: 8,
            fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-primary)',
            background: 'white', outline: 'none', boxSizing: 'border-box',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        />
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {filtered.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 0',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              opacity: item.hasOfficial ? 1 : 0.55
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.hasOfficial ? '#15803D' : '#D1D5DB', flexShrink: 0, marginTop: 2 }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)' }}>
                  {item.date}
                </span>
                {item.hasOfficial ? (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)' }}>
                      par {item.author} · validé par {item.validator}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                    Pas de brouillon officiel
                  </span>
                )}
              </div>
              {item.hasOfficial && (
                <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-secondary)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                    {item.lesson}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-body)' }}>
                    {item.chants} chants
                  </span>
                </div>
              )}
            </div>
            {item.hasOfficial && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Btn variant="ghost" size="sm">Consulter</Btn>
                <Btn variant="ghost" size="sm"><IconDownload /> PDF</Btn>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-muted)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            Aucun résultat pour « {query} »
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Historique });
