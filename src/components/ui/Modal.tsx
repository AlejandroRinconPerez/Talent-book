import React, { useEffect, useEffectEvent, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small context line rendered above the title (e.g. "Linking to: Search name"). */
  context?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Set when the body manages its own scrolling (e.g. a list with a fixed toolbar). */
  bodyClassName?: string;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl'
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: labelled, modal, closes on Escape and backdrop click,
 * traps Tab, restores focus to the opener, locks page scroll.
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  context,
  onClose,
  children,
  footer,
  size = 'md',
  bodyClassName = ''
}) => {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Latest onClose without re-running the mount effect (which would re-focus on every parent render)
  const requestClose = useEffectEvent(() => onClose());

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first control, or the dialog itself.
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog)?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        requestClose();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null
      );
      if (focusables.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4 animate-fade"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`panel flex w-full max-h-[calc(100dvh-1rem)] flex-col rounded-b-none rounded-t-xl shadow-pop outline-none animate-pop sm:max-h-[calc(100dvh-2rem)] sm:rounded-lg ${SIZE_CLASS[size]}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-rule px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            {context ? <div className="mb-1 text-[13px] text-ink-3">{context}</div> : null}
            <h2 id={titleId} className="text-xl font-semibold leading-snug text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-ink-2">
                {description}
              </p>
            ) : null}
          </div>
          <Button variant="icon" aria-label="Close dialog" onClick={onClose} className="-mr-1.5 -mt-1 shrink-0">
            <X className="size-5" />
          </Button>
        </header>

        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 ${bodyClassName}`}>
          {children}
        </div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-rule px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
};
