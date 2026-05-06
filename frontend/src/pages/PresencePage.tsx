import { useEffect, useState } from 'react';
import { getUtilisateurs, getPresence, savePresence, getPresenceDates, getStatsParticipation } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import type { User, Presence, PresenceStat, StatutPresence } from '../types';
import toast from 'react-hot-toast';

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function prevWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  return localDateStr(d);
}

function nextWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 7);
  return localDateStr(d);
}

function lastSaturday(): string {
  const d = new Date();
  const day = d.getDay();
  // day=6 → today is Saturday (offset 0), day=0 → yesterday (offset 1), etc.
  const offset = day === 6 ? 0 : (day + 1);
  d.setDate(d.getDate() - offset);
  return localDateStr(d);
}

function isInFuture(dateStr: string): boolean {
  return new Date(dateStr + 'T00:00:00') > new Date(localDateStr() + 'T00:00:00');
}

type StatutOption = { value: StatutPresence; label: string; short: string; color: string; bg: string };

const OPTIONS: StatutOption[] = [
  { value: 'present', label: 'Présent', short: 'P', color: '#15803D', bg: '#F0FDF4' },
  { value: 'excuse',  label: 'Excusé',  short: 'E', color: '#D97706', bg: '#FFFBEB' },
  { value: 'absent',  label: 'Absent',  short: 'A', color: '#DC2626', bg: '#FEF2F2' },
];

type Tab = 'saisie' | 'stats';

export default function PresencePage() {
  const { user } = useAuthStore();
  const isResp = user?.role === 'responsable' || user?.role === 'admin';

  const [tab, setTab] = useState<Tab>('saisie');
  const [users, setUsers] = useState<User[]>([]);
  const [presences, setPresences] = useState<Record<number, StatutPresence>>({});
  const [date, setDate] = useState(lastSaturday());
  const [enregistreeDates, setEnregistreeDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState<PresenceStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [anneeStats, setAnneeStats] = useState<number>(new Date().getFullYear());

  const load = async () => {
    setLoading(true);
    try {
      const [allUsers, pres, dates] = await Promise.all([
        getUtilisateurs(),
        getPresence(date),
        getPresenceDates(),
      ]);
      setUsers(allUsers);
      setEnregistreeDates(dates);
      const map: Record<number, StatutPresence> = {};
      pres.forEach((p: Presence) => { map[p.user.id] = p.statut; });
      setPresences(map);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getStatsParticipation({ annee: anneeStats });
      setStats(data);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => { load(); }, [date]);
  useEffect(() => { if (tab === 'stats') loadStats(); }, [tab, anneeStats]);

  const toggle = (userId: number, statut: StatutPresence) => {
    if (!isResp) return;
    setPresences(prev => ({ ...prev, [userId]: statut }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const list = users.map(u => ({
        user_id: u.id,
        statut: presences[u.id] ?? 'absent',
      }));
      await savePresence(date, list);
      toast.success('Présence enregistrée.');
      const dates = await getPresenceDates();
      setEnregistreeDates(dates);
    } catch {} finally {
      setSaving(false);
    }
  };

  const today = localDateStr();
  const canGoNext = nextWeek(date) <= today;
  const isEnregistree = enregistreeDates.includes(date);

  const nbPresent = users.filter(u => presences[u.id] === 'present').length;
  const nbExcuse  = users.filter(u => presences[u.id] === 'excuse').length;
  const nbAbsent  = users.filter(u => presences[u.id] === 'absent').length;
  const nbTotal   = users.length;

  const anneesDispos = [...new Set(enregistreeDates.map(d => new Date(d + 'T00:00:00').getFullYear()))].sort((a, b) => b - a);

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>
          Présence
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 3 }}>
          Répétition du samedi
        </p>
      </div>

      {/* Onglets */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        <div className={`tab-item${tab === 'saisie' ? ' active' : ''}`} onClick={() => setTab('saisie')} role="tab" aria-selected={tab === 'saisie'}>
          Saisie
        </div>
        <div className={`tab-item${tab === 'stats' ? ' active' : ''}`} onClick={() => setTab('stats')} role="tab" aria-selected={tab === 'stats'}>
          Statistiques
        </div>
      </div>

      {tab === 'saisie' && (
        <>
          {/* Navigation date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setDate(prevWeek(date))}
              style={{ padding: '6px 10px' }}
              aria-label="Semaine précédente"
            >
              ← Préc.
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <input
                type="date"
                className="field"
                style={{ width: 'auto', fontSize: 13, flex: 1 }}
                value={date}
                onChange={e => setDate(e.target.value)}
                aria-label="Date de la répétition"
              />
              {isEnregistree && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC', whiteSpace: 'nowrap',
                }}>
                  ✓ Enregistrée
                </span>
              )}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setDate(nextWeek(date))}
              disabled={!canGoNext}
              style={{ padding: '6px 10px' }}
              aria-label="Semaine suivante"
            >
              Suiv. →
            </button>
          </div>

          {isInFuture(date) && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 6, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
              Cette date est dans le futur. Tu peux pré-remplir la présence.
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Spinner size={32} />
            </div>
          ) : (
            <>
              {/* Stats rapides */}
              {nbTotal > 0 && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Présent', count: nbPresent, color: '#15803D', bg: '#F0FDF4' },
                    { label: 'Excusé',  count: nbExcuse,  color: '#D97706', bg: '#FFFBEB' },
                    { label: 'Absent',  count: nbAbsent,  color: '#DC2626', bg: '#FEF2F2' },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, minWidth: 72,
                      background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
                    </div>
                  ))}
                  <div style={{
                    flex: 1, minWidth: 72,
                    background: 'var(--bg-page)', borderRadius: 8, padding: '10px 14px', textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-primary)' }}>{nbTotal}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 600 }}>Total</div>
                  </div>
                </div>
              )}

              {/* Liste moniteurs */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {users.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
                    Aucun moniteur enregistré.
                  </div>
                ) : (
                  users.map((u, i) => {
                    const statut = presences[u.id];
                    const opt = OPTIONS.find(o => o.value === statut);
                    return (
                      <div key={u.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        background: opt ? opt.bg : 'var(--bg-card)',
                        borderBottom: i < users.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        transition: 'background 150ms ease',
                      }}>
                        <Avatar nom={u.nom} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.nom}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--fg-muted)', textTransform: 'capitalize' }}>{u.role}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }} role="group" aria-label={`Présence de ${u.nom}`}>
                          {OPTIONS.map(o => (
                            <button
                              key={o.value}
                              onClick={() => toggle(u.id, o.value)}
                              title={o.label}
                              disabled={!isResp}
                              aria-pressed={statut === o.value}
                              style={{
                                width: 36, height: 32, borderRadius: 6,
                                border: statut === o.value ? `2px solid ${o.color}` : '1px solid var(--border-medium)',
                                background: statut === o.value ? o.bg : 'white',
                                color: statut === o.value ? o.color : 'var(--fg-muted)',
                                fontWeight: 700, fontSize: 12,
                                cursor: isResp ? 'pointer' : 'default',
                                transition: 'all 120ms ease',
                              }}
                            >
                              {o.short}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Légende */}
              <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                {OPTIONS.map(o => (
                  <span key={o.value} style={{ fontSize: 11, color: o.color }}>
                    <strong>{o.short}</strong> = {o.label}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4, fontStyle: 'italic' }}>
                "Excusé" = a prévenu à l'avance · "Absent" = absent sans justification
              </p>

              {isResp && (
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Spinner size={14} /> : 'Enregistrer la présence'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'stats' && (
        <>
          {/* Sélecteur d'année */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)' }}>Année :</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(anneesDispos.length > 0 ? anneesDispos : [new Date().getFullYear()]).map(y => (
                <button
                  key={y}
                  onClick={() => setAnneeStats(y)}
                  className={`btn btn-sm ${anneeStats === y ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {loadingStats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Spinner size={32} />
            </div>
          ) : stats.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 15, color: 'var(--fg-muted)' }}>Aucune donnée de présence pour {anneeStats}.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-page)' }}>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--fg-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Moniteur</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700, color: '#15803D', fontSize: 11 }} title="Présent">P</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700, color: '#D97706', fontSize: 11 }} title="Excusé">E</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700, color: '#DC2626', fontSize: 11 }} title="Absent">A</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--fg-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={s.user.id} style={{
                      borderBottom: i < stats.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-page)',
                    }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar nom={s.user.nom} size={24} />
                          <span style={{ fontWeight: 500, color: 'var(--fg-primary)' }}>{s.user.nom}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>{s.nb_present}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#D97706', fontWeight: 600 }}>{s.nb_excuse}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#DC2626', fontWeight: 600 }}>{s.nb_absent}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <TauxBar taux={s.taux} total={s.nb_total} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TauxBar({ taux, total }: { taux: number; total: number }) {
  const color = taux >= 75 ? '#15803D' : taux >= 50 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
      <div style={{ width: 60, height: 6, background: 'var(--border-subtle)', borderRadius: 99, overflow: 'hidden' }} role="progressbar" aria-valuenow={taux} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ height: '100%', width: `${taux}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 38, textAlign: 'right' }}>
        {total > 0 ? `${taux}%` : '—'}
      </span>
    </div>
  );
}
