import React from 'react';

interface TalentBookLogoProps {
  className?: string;
  showText?: boolean;
}

export const TalentBookLogo: React.FC<TalentBookLogoProps> = ({ 
  className = "h-9 w-auto", 
  showText = true 
}) => {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* SVG Icon matching official Talent Book book & talent icon */}
      <svg 
        viewBox="0 0 160 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto shrink-0 aspect-[4/3]"
        aria-label="Talent Book Logo Icon"
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
            <stop offset="0%" stopColor="#006978" />
            <stop offset="100%" stopColor="#00838F" />
          </linearGradient>
          <linearGradient id="tb-cyan-right" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ACC1" />
            <stop offset="100%" stopColor="#26C6DA" />
          </linearGradient>
          <filter id="tb-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Back Orange Left Wings */}
        <path
          d="M10 40 C10 40 18 36 28 36 L28 85 C18 85 10 82 10 82 Z"
          fill="#E65100"
          opacity="0.9"
        />
        {/* Main Orange Left Bottom Page */}
        <path
          d="M14 44 C26 42 45 46 76 86 C52 75 28 75 14 87 C11 88 10 86 10 83 L10 49 C10 45 12 44 14 44 Z"
          fill="url(#tb-orange-left)"
        />

        {/* Back Orange Right Wings */}
        <path
          d="M150 40 C150 40 142 36 132 36 L132 85 C142 85 150 82 150 82 Z"
          fill="#FFA000"
          opacity="0.9"
        />
        {/* Main Orange Right Bottom Page */}
        <path
          d="M146 44 C134 42 115 46 84 86 C108 75 132 75 146 87 C149 88 150 86 150 83 L150 49 C150 45 148 44 146 44 Z"
          fill="url(#tb-orange-right)"
        />

        {/* Inner Teal Left Open Page */}
        <path
          d="M26 27 C42 27 65 37 77 78 C59 66 38 66 26 73 C25 73.5 24 72.8 24 71.5 L24 30 C24 28 25 27 26 27 Z"
          fill="url(#tb-teal-left)"
          filter="url(#tb-shadow)"
        />

        {/* Inner Bright Cyan Right Open Page */}
        <path
          d="M134 27 C118 27 95 37 83 78 C101 66 122 66 134 73 C135 73.5 136 72.8 136 71.5 L136 30 C136 28 135 27 134 27 Z"
          fill="url(#tb-cyan-right)"
          filter="url(#tb-shadow)"
        />

        {/* Central Spine shadow */}
        <path
          d="M78 84 C80 87 80 87 82 84 C81 78 79 78 78 84 Z"
          fill="#FFB300"
        />

        {/* White Center Human Silhouette (Head) */}
        <circle 
          cx="80" 
          cy="50" 
          r="13" 
          fill="#FFFFFF" 
          filter="url(#tb-shadow)"
        />

        {/* White Center Human Silhouette (Shoulders / Torso) */}
        <path
          d="M62 76 C62 67 70 63 80 63 C90 63 98 67 98 76 C93 79 87 81 80 81 C73 81 67 79 62 76 Z"
          fill="#FFFFFF"
          filter="url(#tb-shadow)"
        />
      </svg>

      {/* Styled Brand Typography */}
      {showText && (
        <div className="flex items-baseline tracking-tight font-extrabold text-xl leading-none">
          <span className="text-[#005F73] font-black">Talent</span>
          <span className="text-[#00B4D8] font-black ml-0.5">Book</span>
        </div>
      )}
    </div>
  );
};
