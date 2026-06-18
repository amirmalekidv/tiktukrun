'use client';

export default function WheelArrow() {
  return (
    <g>
      {/* Arrow pointer at top */}
      <polygon
        points="150,8 143,26 157,26"
        fill="#dc2626"
        filter="url(#arrowGlow)"
      />
      <polygon
        points="150,10 144,25 156,25"
        fill="#ff2222"
        opacity="0.6"
      />
      {/* Arrow shaft */}
      <rect x="148" y="22" width="4" height="12" fill="#dc2626" rx="1" />

      {/* Glow filter reference */}
      <defs>
        <filter id="arrowGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </g>
  );
}
