import { useEffect, useRef } from 'react';
import { Spinner } from './Spinner';

interface ConfirmModalProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  variant?: 'danger' | 'primary' | 'gold';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmer',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const btnClass = `btn btn-${variant}`;

  // Focus the confirm button on mount
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  // Escape closes the modal (unless loading)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [loading, onCancel]);

  return (
    <>
      {/* Overlay : ne ferme pas si une action est en cours */}
      <div
        className="overlay"
        onClick={() => { if (!loading) onCancel(); }}
        aria-hidden="true"
      />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        style={{ maxWidth: 420 }}
      >
        <h3
          id="confirm-title"
          style={{
            fontFamily: 'Lora, serif',
            fontSize: 17,
            fontWeight: 600,
            color: 'var(--fg-primary)',
            marginBottom: 10,
          }}
        >
          {title}
        </h3>
        <div style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.65, marginBottom: 20 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button ref={confirmRef} className={btnClass} onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size={14} /> : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
