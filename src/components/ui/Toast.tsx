import React, { useEffect, useEffectEvent } from 'react';
import { Check, AlertCircle, Undo2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  /** Optional undo affordance, shown as a button inside the toast. */
  onUndo?: () => void;
  durationMs?: number;
  /** Errors are announced assertively and carry a warning icon. */
  tone?: 'success' | 'error';
}

/** Polite live region for confirmations (assertive for errors). Rendered at all times so announcements are reliable. */
export const Toast: React.FC<ToastProps> = ({ message, onDismiss, onUndo, durationMs = 5000, tone = 'success' }) => {
  // Keep the timer tied to the message, not to the identity of the dismiss callback
  const dismiss = useEffectEvent(() => onDismiss());

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(dismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs]);

  const isError = tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4 sm:justify-end sm:px-6"
    >
      {message ? (
        <div
          className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-pop animate-rise ${
            isError ? 'border border-danger/30 bg-danger-wash text-danger' : 'bg-inverse text-on-inverse'
          }`}
        >
          {isError ? <AlertCircle className="size-4 shrink-0" /> : <Check className="size-4 shrink-0 text-on-inverse-accent" />}
          <span>{message}</span>
          {onUndo && !isError ? (
            <button
              type="button"
              onClick={onUndo}
              className="ml-1 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-semibold text-on-inverse-accent hover:bg-on-inverse/10"
            >
              <Undo2 className="size-3.5" />
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
