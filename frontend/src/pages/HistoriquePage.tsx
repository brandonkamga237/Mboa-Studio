import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistorique } from '../api/client';
import { StatusPill } from '../components/ui/StatusPill';
import { Spinner } from '../components/ui/Spinner';
import type { BrouillonSummary } from '../types';

function formatDateFr(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getYear(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getFullYear();
}

export default function HistoriquePage() {
  const navigate = useNavigate();
  const [brouillons, setBrouillons] = useState<BrouillonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [anneeFiltre, setAnneeFiltre] = useState<number | null>(null);

  const isSearching = query !== debouncedQuery;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getHistorique(debouncedQuery || undefined);
        setBrouillons(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debouncedQuery]);

  const annees = [...new Set(brouillons.map(b => getYear(b.date_dimanche)))].sort((a, b) => b - a);

  const filtered = anneeFiltre
    ? brouillons.filter(b => getYear(b.date_dimanche) === anneeFiltre)
    : brouillons;

  const grouped: Record<number, BrouillonSummary[]> = {};
  filtered.forEach(b => {
    const y = getYear(b.date_dimanche);
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(b);
  });

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>
          Historique
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 4 }}>
          {brouillons.length} culte{brouillons.length !== 1 ? 's' : ''} enregistré{brouillons.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Recherche + filtre */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', pointerEvents: 'none' }}>
            {isSearching ? <Spinner size={14} /> : <IcoSearch />}
          </span>
          <input
            className="field"
            style={{ paddingLeft: 34, fontSize: 14 }}
            placeholder="Rechercher par leçon, liturgie, mot-clé…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Rechercher dans l'historique"
          />
        </div>
        {annees.length > 1 && (
          <select
            className="field"
            style={{ width: 'auto', fontSize: 13 }}
            value={anneeFiltre ?? ''}
            onChange={e => setAnneeFiltre(e.target.value ? Number(e.target.value) : null)}
            aria-label="Filtrer par année"
          >
            <option value="">Toutes les années</option>
            {annees.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 15, color: 'var(--fg-muted)' }}>
            {debouncedQuery
              ? `Aucun résultat pour « ${debouncedQuery} »`
              : "Aucun brouillon officiel dans l'historique."}
          </p>
        </div>
      ) : (
        Object.keys(grouped).sort((a, b) => Number(b) - Number(a)).map(annee => (
          <div key={annee}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--fg-muted)',
              padding: '4px 0 10px', marginTop: 8,
              borderBottom: '1px solid var(--border-subtle)', marginBottom: 12,
            }}>
              {annee} · {grouped[Number(annee)].length} culte{grouped[Number(annee)].length > 1 ? 's' : ''}
            </div>
            {grouped[Number(annee)].map(b => (
              <div
                key={b.id}
                className="card"
                style={{ marginBottom: 10, cursor: 'pointer' }}
                onClick={() => navigate(`/brouillons/${b.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 2 }}>
                      {formatDateFr(b.date_dimanche)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: b.apercu_lecon ? 4 : 0 }}>
                      Par {b.auteur.nom} · {b.nb_chants} chant{b.nb_chants !== 1 ? 's' : ''}
                    </div>
                    {b.apercu_lecon && (
                      <div style={{ fontSize: 12, color: 'var(--fg-secondary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.apercu_lecon}
                      </div>
                    )}
                  </div>
                  <StatusPill statut={b.statut} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/brouillons/${b.id}`)}>
                    Consulter
                  </button>
                  <a
                    href={`/api/brouillons/${b.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function IcoSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
