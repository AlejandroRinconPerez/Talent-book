import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'subtle'
  | 'commercial'
  | 'danger-ghost'
  | 'icon'
  | 'on-dark';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  /** Shows a spinner and swaps the label for `loadingLabel` while true. */
  loading?: boolean;
  loadingLabel?: string;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    loadingLabel,
    icon,
    className = '',
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref
) {
  const isIconOnly = variant === 'icon';
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">{icon}</span>
      ) : null}
      {isIconOnly ? (
        children
      ) : (
        <span>{loading && loadingLabel ? loadingLabel : children}</span>
      )}
    </button>
  );
});
