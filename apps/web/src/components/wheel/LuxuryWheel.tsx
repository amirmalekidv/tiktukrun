'use client';
import { useMemo } from 'react';
import { formatPrizeValue, getPrizeDisplay } from '@/lib/wheel-adapter';
import {
  buildSlicePath,
  getTextPosition,
  getSliceColors,
  getLedPositions,
  type WheelPrize,
} from '@/lib/wheel-engine';

interface WheelSliceProps {
  index: number;
  total: number;
  prize: WheelPrize;
}

function WheelSlice({ index, total, prize }: WheelSliceProps) {
  const display = getPrizeDisplay(prize.type);
  const sliceValue = formatPrizeValue(prize);
  const path = buildSlicePath(index, total, 140, 150, 150);
  const textPos = getTextPosition(index, total, 95, 150, 150);
  const colors = getSliceColors(index);
  const gradientId = `slice-gradient-${index}`;

  return (
    <g>
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={colors.start} />
          <stop offset="100%" stopColor={colors.end} />
        </radialGradient>
      </defs>

      {/* Slice */}
      <path
        d={path}
        fill={`url(#${gradientId})`}
        stroke="#1a0000"
        strokeWidth="1.5"
      />

      {/* Text label */}
      <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${textPos.rotate})`}>
        <text
          x="0"
          y="-8"
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize="9"
          fontFamily="Cinzel, serif"
          fontWeight="bold"
        >
          {display.emoji}
        </text>
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fill="rgba(255,200,200,0.8)"
          fontSize="7"
          fontFamily="Cinzel, serif"
        >
          {sliceValue || prize.label.slice(0, 8)}
        </text>
      </g>

      {/* Divider line */}
      <line
        x1="150"
        y1="150"
        x2={150 + 140 * Math.cos(((index * 360) / total - 90) * (Math.PI / 180))}
        y2={150 + 140 * Math.sin(((index * 360) / total - 90) * (Math.PI / 180))}
        stroke="#3a0000"
        strokeWidth="1"
        opacity="0.6"
      />
    </g>
  );
}

interface WheelLightsProps {
  count?: number;
  isSpinning?: boolean;
}

function WheelLights({ count = 16, isSpinning = false }: WheelLightsProps) {
  const positions = getLedPositions(count, 145, 150, 150);

  return (
    <g>
      {positions.map((pos, i) => (
        <circle
          key={i}
          cx={pos.x}
          cy={pos.y}
          r="3.5"
          fill={i % 2 === 0 ? '#dc2626' : '#7f1d1d'}
          opacity={isSpinning ? (i % 2 === 0 ? 1 : 0.3) : 0.7}
        >
          {isSpinning && (
            <animate
              attributeName="opacity"
              values={i % 2 === 0 ? '1;0.3;1' : '0.3;1;0.3'}
              dur={`${0.4 + (i % 4) * 0.1}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}
    </g>
  );
}

function WheelCenter() {
  return (
    <g>
      {/* Outer ring */}
      <circle cx="150" cy="150" r="22" fill="#1a0000" stroke="#7f1d1d" strokeWidth="2" />
      {/* Inner circle */}
      <circle cx="150" cy="150" r="16" fill="#0d0000" stroke="#dc2626" strokeWidth="1.5" />
      {/* Skull text */}
      <text
        x="150"
        y="156"
        textAnchor="middle"
        fill="#dc2626"
        fontSize="18"
        fontFamily="serif"
      >
        💀
      </text>
    </g>
  );
}

const DEMO_PRIZES: WheelPrize[] = [
  { id: '1', label: '۵۰۰ XP', type: 'xp', value: 500, weight: 20 },
  { id: '2', label: '۱۰۰ سکه', type: 'coins', value: 100, weight: 25 },
  { id: '3', label: '۵ الماس', type: 'diamonds', value: 5, weight: 10 },
  { id: '4', label: '۲۰۰ XP', type: 'xp', value: 200, weight: 20 },
  { id: '5', label: 'شانس ندارید', type: 'nothing', value: 0, weight: 15 },
  { id: '6', label: '۵۰۰ سکه', type: 'coins', value: 500, weight: 5 },
  { id: '7', label: '۱۰۰۰ XP', type: 'xp', value: 1000, weight: 3 },
  { id: '8', label: '۱۰ الماس', type: 'diamonds', value: 10, weight: 2 },
];

interface LuxuryWheelProps {
  prizes: WheelPrize[];
  rotation: number;
  isSpinning: boolean;
}

export default function LuxuryWheel({ prizes, rotation, isSpinning }: LuxuryWheelProps) {
  const displayPrizes = useMemo(
    () => (prizes.length > 0 ? prizes : DEMO_PRIZES),
    [prizes]
  );

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)',
          animation: isSpinning ? 'pulse 0.5s infinite' : 'none',
        }}
      />

      <svg
        viewBox="0 0 300 300"
        className="w-full max-w-[340px]"
        style={{
          filter: 'drop-shadow(0 0 30px rgba(220,38,38,0.4))',
        }}
      >
        <defs>
          <filter id="wheelGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer border rings */}
        <circle cx="150" cy="150" r="148" fill="none" stroke="#7f1d1d" strokeWidth="3" />
        <circle cx="150" cy="150" r="142" fill="none" stroke="#3a0000" strokeWidth="1" opacity="0.5" />

        {/* LEDs (not rotating) */}
        <WheelLights count={16} isSpinning={isSpinning} />

        {/* Rotating wheel group — CSS transform transition applied via style prop on SVG group */}
        <g
          style={{
            transformOrigin: '150px 150px',
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              : 'none',
            willChange: 'transform',
          }}
        >
          {displayPrizes.map((prize, i) => (
            <WheelSlice
              key={prize.id}
              index={i}
              total={displayPrizes.length}
              prize={prize}
            />
          ))}
        </g>

        {/* Static center hub (above slices) */}
        <WheelCenter />

        {/* Arrow pointer */}
        <g filter="url(#wheelGlow)">
          <polygon
            points="150,8 144,28 156,28"
            fill="#dc2626"
            stroke="#ff0000"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}
