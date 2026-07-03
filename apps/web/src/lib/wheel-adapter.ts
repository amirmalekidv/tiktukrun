import type { WheelPrize, WheelPrizeType } from './wheel-engine';

export interface ApiWheelPrize {
  id: string | number;
  name?: string;
  label?: string;
  type?: string;
  value?: number;
  probabilityWeight?: number;
  weight?: number;
  color?: string;
  icon?: string;
}

const API_TYPE_MAP: Record<string, WheelPrizeType> = {
  COINS: 'coins',
  DIAMONDS: 'diamonds',
  XP: 'xp',
  DISCOUNT_CODE: 'discount',
  FREE_TICKET: 'ticket',
  TOMAN: 'toman',
  NOTHING: 'nothing',
  coins: 'coins',
  diamonds: 'diamonds',
  xp: 'xp',
  discount: 'discount',
  discount_code: 'discount',
  free_ticket: 'ticket',
  ticket: 'ticket',
  toman: 'toman',
  item: 'item',
  nothing: 'nothing',
};

export interface PrizeDisplay {
  icon: string;
  emoji: string;
  color: string;
  label: string;
}

export const PRIZE_DISPLAY: Record<WheelPrizeType, PrizeDisplay> = {
  xp: { icon: 'fa-bolt', emoji: '⚡', color: '#8b5cf6', label: 'XP' },
  coins: { icon: 'fa-circle', emoji: '🪙', color: '#f59e0b', label: 'سکه' },
  diamonds: { icon: 'fa-gem', emoji: '💎', color: '#22d3ee', label: 'الماس' },
  discount: { icon: 'fa-ticket', emoji: '🎫', color: '#8BC34A', label: '٪ تخفیف' },
  ticket: { icon: 'fa-ticket-alt', emoji: '🎟️', color: '#E91E63', label: 'بلیط رایگان' },
  toman: { icon: 'fa-money-bill-wave', emoji: '💰', color: '#10b981', label: 'تومان' },
  item: { icon: 'fa-gift', emoji: '🎁', color: '#ec4899', label: 'جایزه' },
  nothing: { icon: 'fa-ghost', emoji: '💀', color: '#6b7280', label: 'دفعه بعد!' },
};

export function normalizePrizeType(rawType?: string): WheelPrizeType {
  if (!rawType) return 'item';
  const upper = rawType.toUpperCase();
  const lower = rawType.toLowerCase();
  return API_TYPE_MAP[upper] ?? API_TYPE_MAP[lower] ?? 'item';
}

export function normalizeWheelPrize(raw: ApiWheelPrize): WheelPrize {
  const type = normalizePrizeType(raw.type);
  return {
    id: String(raw.id),
    label: raw.label ?? raw.name ?? PRIZE_DISPLAY[type].label,
    type,
    value: Number(raw.value ?? 0),
    weight: Number(raw.probabilityWeight ?? raw.weight ?? 1),
    color: raw.color,
    icon: raw.icon,
  };
}

export function normalizeWheelPrizes(raw: unknown): WheelPrize[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeWheelPrize(item as ApiWheelPrize));
}

export function getPrizeDisplay(type: WheelPrizeType): PrizeDisplay {
  return PRIZE_DISPLAY[type] ?? PRIZE_DISPLAY.item;
}

export function formatPrizeValue(prize: WheelPrize): string {
  if (prize.type === 'nothing') return '';
  if (prize.type === 'discount') {
    return `+${prize.value.toLocaleString('fa-IR')}٪`;
  }
  if (prize.value > 0) {
    return `+${prize.value.toLocaleString('fa-IR')}`;
  }
  return prize.label.slice(0, 10);
}
