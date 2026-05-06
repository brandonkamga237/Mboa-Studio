// Mises en Commun — Dashboard Screen
// ui_kits/app/Dashboard.jsx

const { useState } = React;

function Dashboard({ onNavigate, userRole = 'moniteur' }) {
  const isResp = userRole === 'responsable' || userRole === 'admin';
  const today = 'Dimanche 11 mai 2025';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>
          Semaine du {today}
        </p>
      </div>

      {/* Week status banner */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                {today}
              </span>
              <span style={{
                background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 999
              }}>Brouillons en cours</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--fg-secondary)', margin: 0, fontFamily: 'var(--font-body)' }}>
              4 brouillons proposés cette semaine · 2 commentaires non lus
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Btn variant="secondary" onClick={() => onNavigate('week-drafts')}>
              <IconList /> Voir les brouillons
            </Btn>
            <Btn variant="primary" onClick={() => onNavigate('my-drafts')}>
              <IconPlus /> Créer le mien
            </Btn>
          </div>
        </div>

        {/* My draft status */}
        <div style={{
          marginTop: 16, padding: '12px 14px', background: 'var(--bg-page)',
          borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 13, color: 'var(--fg-secondary)', fontFamily: 'var(--font-body)' }}>
            Mon brouillon : <strong style={{ color: 'var(--fg-primary)' }}>non commencé</strong>
          </span>
          <Btn variant="ghost" size="sm" onClick={() => onNavigate('my-drafts')}>
            Commencer <IconChevronRight />
          </Btn>
        </div>
      </Card>

      {/* Responsable panel */}
      {isResp && (
        <Card leftColor="#C9952A" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#92400E', marginBottom: 10 }}>
            Actions du Responsable
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="gold" size="sm" onClick={() => onNavigate('week-drafts')}>
              <IconCheck /> 1 brouillon à valider
            </Btn>
            <Btn variant="secondary" size="sm" onClick={() => onNavigate('presence')}>
              Saisir la présence
            </Btn>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Current official */}
        <Card leftColor="#15803D">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#14532D', marginBottom: 10 }}>
            Brouillon officiel actuel
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 4 }}>
            Dimanche 4 mai — par Esther
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 12, fontFamily: 'var(--font-body)' }}>
            10 chants · Leçon : Josué et la terre promise
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm"><IconFile /> Consulter</Btn>
            <Btn variant="secondary" size="sm"><IconDownload /> PDF</Btn>
          </div>
        </Card>

        {/* Recent history */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 10 }}>
            Historique récent
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { date: '4 mai', author: 'Esther', hasOfficial: true },
              { date: '27 avr.', author: 'Paul', hasOfficial: true },
              { date: '20 avr.', author: null, hasOfficial: false },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none'
              }}>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--fg-primary)', fontFamily: 'var(--font-body)' }}>
                    {item.date}
                  </span>
                  {item.hasOfficial ? (
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)', marginLeft: 6 }}>— Officiel par {item.author}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)', marginLeft: 6 }}>— Pas de brouillon officiel</span>
                  )}
                </div>
                {item.hasOfficial && (
                  <Btn variant="ghost" size="sm"><IconDownload /></Btn>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('history')}>
              Voir tout l'historique <IconChevronRight />
            </Btn>
          </div>
        </Card>
      </div>

      {/* Duplicate CTA */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: '#F5E9C8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#92400E', fontFamily: 'var(--font-body)' }}>
          Manque de temps ? Reprenez une fiche précédente comme point de départ.
        </span>
        <Btn variant="secondary" size="sm" style={{ borderColor: '#C9952A', color: '#92400E' }}>
          <IconCopy /> Dupliquer un brouillon
        </Btn>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
