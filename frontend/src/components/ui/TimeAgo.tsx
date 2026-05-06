function fmt(dateStr: string): string {
  const ts = new Date(dateStr).getTime();
  if (isNaN(ts)) return '—';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  const d = Math.floor(diff / 86400);
  if (d < 30) return `il y a ${d} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TimeAgo({ date }: { date: string }) {
  const ts = new Date(date).getTime();
  const fullDate = isNaN(ts) ? '' : new Date(date).toLocaleString('fr-FR');
  return (
    <time dateTime={date} style={{ fontSize: 11, color: 'var(--fg-muted)' }} title={fullDate}>
      {fmt(date)}
    </time>
  );
}
