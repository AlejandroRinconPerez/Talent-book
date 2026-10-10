import React, { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface TourStep {
  /** Where the element lives; the host navigates there before the step shows. */
  tab: 'busquedas' | 'book' | 'candidates';
  /** Element to spotlight, matched by its data-tour attribute. */
  target: string;
  title: string;
  body: string;
}

interface TourProps {
  steps: TourStep[];
  onNavigate: (tab: TourStep['tab']) => void;
  onClose: () => void;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

/**
 * Guided walkthrough: spotlights one element per step with a cut-out overlay
 * and a card explaining it. Keyboard: arrows move, Escape closes.
 */
export const Tour: React.FC<TourProps> = ({ steps, onNavigate, onClose }) => {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const navigate = useEffectEvent((tab: TourStep['tab']) => onNavigate(tab));
  const close = useEffectEvent(() => onClose());

  // Navigate, then wait for the target to exist (lazy sections may still be loading)
  useLayoutEffect(() => {
    navigate(step.tab);
    let cancelled = false;
    let attempts = 0;
    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!el) {
        if (attempts++ < 40) window.setTimeout(measure, 50);
        else setBox(null);
        return;
      }
      el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      const r = el.getBoundingClientRect();
      setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [step]);

  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [steps.length]);

  const isLast = index === steps.length - 1;

  // Card goes below the spotlight when there is room, otherwise above; clamped to the viewport.
  const cardWidth = Math.min(360, window.innerWidth - 32);
  const cardStyle: React.CSSProperties = box
    ? {
        width: cardWidth,
        left: Math.max(16, Math.min(box.left, window.innerWidth - cardWidth - 16)),
        top: box.top + box.height + 12 + 220 < window.innerHeight ? box.top + box.height + 12 : Math.max(16, box.top - 12 - 200)
      }
    : { width: cardWidth, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {box ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-lg ring-2 ring-brand transition-[top,left,width,height] duration-200"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height, boxShadow: '0 0 0 9999px rgb(26 35 41 / 0.55)' }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-ink/55" />
      )}

      <div ref={cardRef} tabIndex={-1} className="panel fixed p-5 shadow-pop outline-none animate-pop" style={cardStyle}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] tabular-nums text-ink-3">
            Step {index + 1} of {steps.length}
          </p>
          <Button variant="icon" aria-label="End tour" onClick={onClose} className="-mr-2 -mt-2">
            <X className="size-4" />
          </Button>
        </div>
        <h2 id="tour-title" className="mt-1 text-lg font-semibold leading-snug">
          {step.title}
        </h2>
        <p className="mt-1.5 text-ink-2">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Skip
          </Button>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setIndex(i => Math.max(i - 1, 0))} disabled={index === 0}>
              Back
            </Button>
            <Button variant="primary" size="sm" onClick={() => (isLast ? onClose() : setIndex(i => i + 1))}>
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

