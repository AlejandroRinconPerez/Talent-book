import React from 'react';

interface TalentBookLogoProps {
  className?: string;
  showText?: boolean;
  /** Teal tile behind mark and wordmark so the white figure reads on any background. */
  tile?: boolean;
}

/** Official Talent Book mark: open book in brand teal/orange with a person at the spine. */
export const TalentBookLogo: React.FC<TalentBookLogoProps> = ({ className = 'h-9', showText = true, tile = true }) => {
  return (
    <span className={`inline-flex select-none ${className}`}>
      <span
        className={`flex h-full items-center gap-2 ${tile ? 'rounded-lg bg-logo-tile py-1 pl-2 pr-3' : ''}`}
        style={{ colorScheme: 'dark' }}
      >
        <svg
          viewBox="10 24 140 68"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[78%] w-auto shrink-0"
          role="img"
          aria-label="Talent Book"
        >
          <defs>
            <linearGradient id="tb-orange-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E65100" />
              <stop offset="100%" stopColor="#F57C00" />
            </linearGradient>
            <linearGradient id="tb-orange-right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA000" />
              <stop offset="100%" stopColor="#FFB300" />
            </linearGradient>
            <linearGradient id="tb-teal-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#005963" />
              <stop offset="100%" stopColor="#007A87" />
            </linearGradient>
            <linearGradient id="tb-cyan-right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1FC2D6" />
              <stop offset="100%" stopColor="#5FDCEA" />
            </linearGradient>
          </defs>
          <path d="M10 40 C10 40 18 36 28 36 L28 85 C18 85 10 82 10 82 Z" fill="#E65100" opacity="0.9" />
          <path d="M14 44 C26 42 45 46 76 86 C52 75 28 75 14 87 C11 88 10 86 10 83 L10 49 C10 45 12 44 14 44 Z" fill="url(#tb-orange-left)" />
          <path d="M150 40 C150 40 142 36 132 36 L132 85 C142 85 150 82 150 82 Z" fill="#FFA000" opacity="0.9" />
          <path d="M146 44 C134 42 115 46 84 86 C108 75 132 75 146 87 C149 88 150 86 150 83 L150 49 C150 45 148 44 146 44 Z" fill="url(#tb-orange-right)" />
          <path d="M26 27 C42 27 65 37 77 78 C59 66 38 66 26 73 C25 73.5 24 72.8 24 71.5 L24 30 C24 28 25 27 26 27 Z" fill="url(#tb-teal-left)" />
          <path d="M134 27 C118 27 95 37 83 78 C101 66 122 66 134 73 C135 73.5 136 72.8 136 71.5 L136 30 C136 28 135 27 134 27 Z" fill="url(#tb-cyan-right)" />
          <path d="M78 84 C80 87 80 87 82 84 C81 78 79 78 78 84 Z" fill="#FFB300" />
          <circle cx="80" cy="50" r="13" fill="#FFFFFF" />
          <path d="M62 76 C62 67 70 63 80 63 C90 63 98 67 98 76 C93 79 87 81 80 81 C73 81 67 79 62 76 Z" fill="#FFFFFF" />
        </svg>

        {showText ? (
          <span className={`flex items-baseline text-xl font-bold leading-none tracking-tight ${tile ? 'text-white' : 'text-brand-ink'}`} aria-hidden="true" translate="no">
            <span>Talent</span>
            <span className={`ml-0.5 ${tile ? 'text-[#BFEFF6]' : 'text-brand'}`}>Book</span>
          </span>
        ) : null}
      </span>
    </span>
  );
};
