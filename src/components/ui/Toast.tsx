import React, { useEffect, useEffectEvent } from 'react';
import { Check, Undo2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  /** Optional undo affordance, shown as a button inside the toast. */
  onUndo?: () => void;
  durationMs?: number;
}

/** Polite live region for confirmations. Rendered at all times so announcements are reliable. */
export const Toast: React.FC<ToastProps> = ({ message, onDismiss, onUndo, durationMs = 5000 }) => {
  // Keep the timer tied to the message, not to the identity of the dismiss callback
  const dismiss = useEffectEvent(() => onDismiss());

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(dismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4 sm:justify-end sm:px-6">
      {message ? (
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-ink px-4 py-3 text-sm text-white shadow-pop animate-rise">
          <Check className="size-4 shrink-0 text-mark-cyan" />
          <span>{message}</span>
          {onUndo ? (
            <button
              type="button"
              onClick={onUndo}
              className="ml-1 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-semibold text-mark-cyan hover:bg-white/10"
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
