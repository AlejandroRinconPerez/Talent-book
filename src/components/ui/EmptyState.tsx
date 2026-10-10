import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** An empty screen is an invitation to act: say what is missing and offer the next step. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center px-6 py-14 text-center ${className}`}>
    {icon && (
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-well text-ink-3" aria-hidden="true">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-ink">{title}</h3>
    {description && <p className="mt-1 max-w-[44ch] text-ink-2">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
