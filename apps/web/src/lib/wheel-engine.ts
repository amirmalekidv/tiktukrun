export type WheelPrizeType =
  | 'xp'
  | 'coins'
  | 'diamonds'
  | 'discount'
  | 'ticket'
  | 'toman'
  | 'item'
  | 'nothing';

export interface WheelPrize {
  id: string;
  label: string;
  type: WheelPrizeType;
  value: number;
  weight: number; // probability weight (sum of all = 100)
  color?: string;
  icon?: string;
}

/**
 * Calculate rotation degrees for a given prize index
 * so the wheel lands precisely on that prize
 */
export function calculateRotation(
  prizeIndex: number,
  totalPrizes: number,
  currentRotation: number = 0
): number {
  const sliceDeg = 360 / totalPrizes;
  // Prize offset: center of target slice should land at top (270deg)
  const targetAngle = 360 - prizeIndex * sliceDeg - sliceDeg / 2;
  // Add 5 full rotations for effect
  const extraSpins = 360 * 5;
  // Normalize to positive
  const base = ((targetAngle - currentRotation) % 360 + 360) % 360;
  return currentRotation + extraSpins + base;
}

/**
 * Calculate prize index from server's prizeId
 */
export function getPrizeIndexById(
  prizeId: string,
  prizes: WheelPrize[]
): number {
  const idx = prizes.findIndex((p) => p.id === prizeId);
  return idx >= 0 ? idx : 0;
}

/**
 * Weighted random selection (client-side preview only, server decides actual result)
 */
export function weightedRandom(prizes: WheelPrize[]): WheelPrize {
  const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const prize of prizes) {
    random -= prize.weight;
    if (random <= 0) return prize;
  }
  return prizes[prizes.length - 1];
}

/**
 * Build SVG path for a wheel slice
 */
export function buildSlicePath(
  index: number,
  total: number,
  radius: number = 150,
  cx: number = 150,
  cy: number = 150
): string {
  const sliceAngle = (2 * Math.PI) / total;
  const startAngle = index * sliceAngle - Math.PI / 2;
  const endAngle = startAngle + sliceAngle;

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);

  const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    'Z',
  ].join(' ');
}

/**
 * Get text position for slice label
 */
export function getTextPosition(
  index: number,
  total: number,
  radius: number = 100,
  cx: number = 150,
  cy: number = 150
): { x: number; y: number; rotate: number } {
  const sliceAngle = (2 * Math.PI) / total;
  const midAngle = index * sliceAngle + sliceAngle / 2 - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(midAngle),
    y: cy + radius * Math.sin(midAngle),
    rotate: (midAngle * 180) / Math.PI + 90,
  };
}

/**
 * Slice gradient colors (neon theme)
 */
export function getSliceColors(index: number): {
  start: string;
  end: string;
} {
  const palettes = [
    { start: '#00f5ff', end: '#0086cc' },
    { start: '#b026ff', end: '#6d1ad6' },
    { start: '#ff00e5', end: '#d1009e' },
    { start: '#ffd700', end: '#ff9d00' },
    { start: '#2ee6a0', end: '#1ba877' },
    { start: '#2b3346', end: '#0e121a' },
    { start: '#ff5470', end: '#d63b52' },
    { start: '#00b3ff', end: '#005f9e' },
  ];
  return palettes[index % palettes.length];
}

/**
 * LED positions around the wheel
 */
export function getLedPositions(
  count: number = 16,
  radius: number = 148,
  cx: number = 150,
  cy: number = 150
): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}
