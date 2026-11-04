import React from 'react';

interface TalentBookLogoProps {
  className?: string;
  showText?: boolean;
}

const logoUrl = new URL('../assets/brand/talent-book-logo-v2.png', import.meta.url).href;

/** Approved artwork; the viewBox removes transparent margins without resampling it. */
export const TalentBookLogo: React.FC<TalentBookLogoProps> = ({ className = 'h-9', showText = true }) => (
  <span className={`inline-flex shrink-0 items-center select-none ${className}`}>
    <svg
      viewBox={showText ? '127 160 1939 413' : '127 160 454 413'}
      width={showText ? 1939 : 454}
      height={413}
      xmlns="http://www.w3.org/2000/svg"
      className="talent-book-logo block h-full w-auto shrink-0 overflow-hidden"
      role="img"
      aria-label="Talent Book"
      focusable="false"
    >
      <image href={logoUrl} width="2171" height="724" />
    </svg>
  </span>
);
