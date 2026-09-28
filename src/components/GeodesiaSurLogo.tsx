import React from 'react';

interface GeodesiaSurLogoProps {
  className?: string;
  theme?: 'color' | 'light'; // 'color' uses corporate navy text, 'light' uses white text for dark backgrounds
}

export const GeodesiaSurLogo: React.FC<GeodesiaSurLogoProps> = ({
  className = 'h-8 w-auto',
  theme = 'color',
}) => {
  const navyText = theme === 'light' ? '#FFFFFF' : '#002B66';
  const subText = theme === 'light' ? '#93C5FD' : '#002B66';

  return (
    <svg
      viewBox="10 8 495 138"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GeodesiaSur TERRA - AQUA Topografía & Acuicultura"
    >
      <defs>
        {/* Pin Gradient: Cyan to Royal Blue */}
        <linearGradient id="pinGradient" x1="45" y1="10" x2="115" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00A8F3" />
          <stop offset="45%" stopColor="#0080FF" />
          <stop offset="100%" stopColor="#0043A8" />
        </linearGradient>

        {/* Pin Inner Shadow / Glow */}
        <radialGradient id="pinInnerGlow" cx="80" cy="46" r="36" gradientUnits="userSpaceOnUse">
          <stop offset="60%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2F1FF" />
        </radialGradient>

        {/* Green Terra Gradient */}
        <linearGradient id="terraGreenGrad" x1="15" y1="70" x2="140" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="50%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>

        {/* Light Green Accent Wave */}
        <linearGradient id="terraLightGrad" x1="20" y1="65" x2="135" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>

        {/* Aqua Cyan Wave */}
        <linearGradient id="aquaCyanGrad" x1="20" y1="85" x2="150" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00C4FF" />
          <stop offset="60%" stopColor="#0088FF" />
          <stop offset="100%" stopColor="#0066CC" />
        </linearGradient>

        {/* Aqua Deep Blue Wave */}
        <linearGradient id="aquaDeepGrad" x1="15" y1="100" x2="140" y2="145" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0077D4" />
          <stop offset="50%" stopColor="#0050A4" />
          <stop offset="100%" stopColor="#002D68" />
        </linearGradient>
      </defs>

      {/* LEFT ICON EMBLEM */}
      <g id="icon-emblem">
        {/* --- BLUE & GREEN WAVE POD (TERRA & AQUA) --- */}
        {/* Bottom deep blue water wave */}
        <path
          d="M 12 105 C 25 125 55 146 95 142 C 122 139 148 122 165 106 C 145 118 115 130 80 125 C 48 120 28 108 12 105 Z"
          fill="url(#aquaDeepGrad)"
        />

        {/* Mid blue wave */}
        <path
          d="M 16 98 C 42 120 85 128 126 116 C 148 109 168 97 178 86 C 158 97 132 106 102 106 C 68 106 38 98 16 98 Z"
          fill="url(#aquaCyanGrad)"
        />

        {/* Top green land swoosh (Terra) */}
        <path
          d="M 12 95 C 28 72 58 60 92 68 C 115 73 136 86 154 98 C 132 87 110 80 86 80 C 52 80 28 88 12 95 Z"
          fill="url(#terraGreenGrad)"
        />

        {/* Green contour highlight */}
        <path
          d="M 22 88 C 42 70 70 65 100 72 C 122 78 142 90 156 100 C 138 91 118 83 95 82 C 65 80 38 84 22 88 Z"
          fill="url(#terraLightGrad)"
          opacity="0.85"
        />

        {/* White separator line between land and water */}
        <path
          d="M 14 96 C 40 102 75 104 110 98 C 132 94 152 86 166 78 C 148 88 124 96 95 98 C 65 100 35 96 14 96 Z"
          fill="#FFFFFF"
          opacity="0.9"
        />

        {/* --- MAP PIN (GPS / GEODESIA) --- */}
        {/* Main Pin Outer Shape */}
        <path
          d="M 80 10 C 54 10 33 31 33 57 C 33 76 56 102 80 120 C 104 102 127 76 127 57 C 127 31 106 10 80 10 Z"
          fill="url(#pinGradient)"
        />

        {/* Inner White Disc of Pin */}
        <circle cx="80" cy="54" r="25" fill="url(#pinInnerGlow)" />

        {/* Stylized Fish inside Disc (pointing left) */}
        <g transform="translate(80, 54)">
          {/* Fish Body */}
          <path
            d="M -15 0 C -12 -6 2 -7 11 -2 C 14 -1 16 -1 18 -4 L 18 4 C 16 1 14 1 11 2 C 2 7 -12 6 -15 0 Z"
            fill="#0080DF"
          />
          {/* Dorsal Fin */}
          <path d="M -3 -6 C 1 -10 6 -8 8 -2 Z" fill="#0080DF" />
          {/* Ventral Fin */}
          <path d="M 0 5 C 3 8 7 7 8 2 Z" fill="#0080DF" />
          {/* Fish Eye */}
          <circle cx="-10" cy="-1.5" r="1.2" fill="#FFFFFF" />
        </g>
      </g>

      {/* RIGHT TEXT CONTENT */}
      {/* 1. GeodesiaSur ® */}
      <g id="brand-text">
        <text
          x="195"
          y="72"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="50"
          letterSpacing="-0.5px"
        >
          <tspan fill={navyText}>Geodesia</tspan>
          <tspan fill="#0088EA">Sur</tspan>
        </text>
        {/* Registered symbol */}
        <text
          x="485"
          y="48"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill={navyText}
        >
          ®
        </text>

        {/* 2. TERRA - AQUA */}
        <text
          x="345"
          y="102"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="800"
          fontSize="20"
          letterSpacing="8px"
          fill={subText}
        >
          TERRA - AQUA
        </text>

        {/* 3. Topografía & Acuicultura */}
        <text
          x="345"
          y="132"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="700"
          fontSize="21"
          letterSpacing="0.8px"
          fill={subText}
        >
          Topografía &amp; Acuicultura
        </text>
      </g>
    </svg>
  );
};
