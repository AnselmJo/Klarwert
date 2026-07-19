interface KlarwertMarkProps {
  className?: string;
}

/** Reduziertes Icon-Motiv (ohne Schriftzug) aus klarwert-icon.svg, für kleine Flächen (Sidebar, Favicon-Kontext). */
export function KlarwertMark({ className }: KlarwertMarkProps) {
  return (
    <svg viewBox="0 0 256 256" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="256" height="256" rx="56" fill="#123138" />
      <rect x="74" y="81" width="108" height="22" rx="11" fill="#f3efe4" />
      <rect x="74" y="117" width="84" height="22" rx="11" fill="#f3efe4" opacity="0.72" />
      <rect x="74" y="153" width="60" height="22" rx="11" fill="#6f9a6d" />
    </svg>
  );
}

interface KlarwertLogoProps {
  className?: string;
}

/** Icon + Schriftzug aus klarwert-logo.svg, für Sidebar-Kopf und Profil/Über-Bereich. */
export function KlarwertLogo({ className }: KlarwertLogoProps) {
  return (
    <svg viewBox="0 0 640 160" className={className} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(16,16) scale(0.5)">
        <rect x="0" y="0" width="256" height="256" rx="56" fill="#123138" />
        <rect x="74" y="81" width="108" height="22" rx="11" fill="#f3efe4" />
        <rect x="74" y="117" width="84" height="22" rx="11" fill="#f3efe4" opacity="0.72" />
        <rect x="74" y="153" width="60" height="22" rx="11" fill="#6f9a6d" />
      </g>
      <text x="176" y="100" fontFamily="Fraunces, Georgia, serif" fontSize="62" fontWeight="500" fill="#262321">
        Klarwert
      </text>
    </svg>
  );
}
