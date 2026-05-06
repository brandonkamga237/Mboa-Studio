export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid var(--brand-stone)',
        borderTopColor: 'var(--brand-blue)',
        display: 'inline-block',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}
