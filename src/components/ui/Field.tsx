import React from 'react';

interface FieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  /** Visually hides the label (still read by assistive tech). */
  hideLabel?: boolean;
  className?: string;
  /** A single form control; `id`, `aria-describedby` and `aria-invalid` are injected. */
  children: React.ReactElement;
}

/** Label + control + hint/error, wired together for assistive technology. */
export const Field: React.FC<FieldProps> = ({
  id,
  label,
  hint,
  error,
  optional,
  hideLabel,
  className = '',
  children
}) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  const control = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined
  });

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'label'}>
        {label}
        {optional && <span className="ml-1 font-normal text-ink-3">(optional)</span>}
      </label>
      {control}
      {error && (
        <p id={errorId} className="error-text" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
    </div>
  );
};
