type AvatarTypeRaw = 'hat' | 'glasses' | 'skin' | 'effect' | 'background' | 'HAT' | 'GLASSES' | 'SKIN' | 'EFFECT' | 'BACKGROUND';

export type AvatarTab = 'hat' | 'glasses' | 'skin' | 'effect' | 'background';

export interface AvatarUiConfig {
  hat?: string;
  glasses?: string;
  skin?: string;
  effect?: string;
  background?: string;
}

export interface AvatarUiItem {
  id: string;
  code?: string;
  name: string;
  type: AvatarTab;
  icon: string;
  diamondCost: number;
  status: 'locked' | 'unlocked' | 'purchased' | 'active';
  preview?: string;
}

const TYPE_MAP: Record<string, AvatarTab> = {
  hat: 'hat',
  HAT: 'hat',
  glasses: 'glasses',
  GLASSES: 'glasses',
  skin: 'skin',
  SKIN: 'skin',
  effect: 'effect',
  EFFECT: 'effect',
  background: 'background',
  BACKGROUND: 'background',
};

const DEFAULT_ICONS: Record<AvatarTab, string> = {
  hat: '🎩',
  glasses: '🕶️',
  skin: '💀',
  effect: '✨',
  background: '🌑',
};

export const DEMO_AVATAR_ITEMS: AvatarUiItem[] = [
  { id: 'demo-hat-pumpkin', code: 'hat_pumpkin', name: 'کلاه کدویی', type: 'hat', icon: '🎃', diamondCost: 0, status: 'active' },
  { id: 'demo-hat-witch', code: 'hat_witch', name: 'کلاه جادوگر', type: 'hat', icon: '🎩', diamondCost: 12, status: 'locked' },
  { id: 'demo-hat-crown', code: 'hat_crown', name: 'تاج نفرین‌شده', type: 'hat', icon: '👑', diamondCost: 24, status: 'locked' },
  { id: 'demo-glasses-shadow', code: 'glasses_shadow', name: 'عینک سایه', type: 'glasses', icon: '🕶️', diamondCost: 0, status: 'active' },
  { id: 'demo-glasses-spectral', code: 'glasses_spectral', name: 'عینک طیفی', type: 'glasses', icon: '👓', diamondCost: 15, status: 'locked' },
  { id: 'demo-skin-ember', code: 'skin_ember', name: 'پوست خاکستر', type: 'skin', icon: '💀', diamondCost: 0, status: 'active' },
  { id: 'demo-skin-bonefire', code: 'skin_bonefire', name: 'پوست استخوانی', type: 'skin', icon: '☠️', diamondCost: 20, status: 'locked' },
  { id: 'demo-effect-pulse', code: 'effect_pulse', name: 'هاله خون', type: 'effect', icon: '✨', diamondCost: 0, status: 'active' },
  { id: 'demo-effect-runes', code: 'effect_runes', name: 'رون‌های نفرین', type: 'effect', icon: '🔮', diamondCost: 28, status: 'locked' },
  { id: 'demo-background-default', code: 'background_default', name: 'مه سرخ', type: 'background', icon: '🌑', diamondCost: 0, status: 'active' },
  { id: 'demo-background-fire', code: 'background_fire', name: 'دوزخ آتش', type: 'background', icon: '🔥', diamondCost: 18, status: 'locked' },
  { id: 'demo-background-cemetery', code: 'background_cemetery', name: 'گورستان', type: 'background', icon: '🪦', diamondCost: 26, status: 'locked' },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function toAvatarType(value: unknown): AvatarTab | null {
  if (typeof value !== 'string') return null;
  return TYPE_MAP[value] ?? null;
}

function toNumber(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toItemStatus(raw: Record<string, unknown>, type: AvatarTab): AvatarUiItem['status'] {
  if (raw.isEquipped === true) return 'active';
  if (raw.status === 'default' || raw.status === 'owned' || raw.status === 'purchased' || raw.status === 'active') {
    return raw.status === 'active' ? 'active' : 'purchased';
  }
  if (raw.isDefault === true && (type === 'hat' || type === 'glasses' || type === 'skin' || type === 'effect' || type === 'background')) {
    return 'purchased';
  }
  return 'locked';
}

export function normalizeAvatarItems(raw: unknown): AvatarUiItem[] {
  const payload = Array.isArray(raw) ? raw : asRecord(raw)?.items;
  if (!Array.isArray(payload)) return [];

  return payload
    .map((entry) => {
      const item = asRecord(entry);
      if (!item) return null;

      const id = item.id;
      const type = toAvatarType(item.type);
      if (typeof id !== 'string' || !type) return null;

      return {
        id,
        code: typeof item.code === 'string' ? item.code : undefined,
        name: typeof item.name === 'string' && item.name.trim() ? item.name : 'آیتم آواتار',
        type,
        icon: typeof item.icon === 'string' && item.icon.trim() ? item.icon : DEFAULT_ICONS[type],
        diamondCost: toNumber(item.priceDiamonds ?? item.diamondCost, 0),
        status: toItemStatus(item, type),
        preview: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export function normalizeAvatarConfig(raw: unknown): AvatarUiConfig {
  const record = asRecord(asRecord(raw)?.config ?? raw);
  if (!record) return {};

  return {
    hat: typeof record.hatId === 'string' ? record.hatId : undefined,
    glasses: typeof record.glassesId === 'string' ? record.glassesId : undefined,
    skin: typeof record.skinId === 'string' ? record.skinId : undefined,
    effect: typeof record.effectId === 'string' ? record.effectId : undefined,
    background: typeof record.backgroundId === 'string' ? record.backgroundId : undefined,
  };
}

export function serializeAvatarConfig(config: AvatarUiConfig) {
  const next: Record<string, string> = {};

  if (config.hat) next.hatId = config.hat;
  if (config.glasses) next.glassesId = config.glasses;
  if (config.skin) next.skinId = config.skin;
  if (config.effect) next.effectId = config.effect;
  if (config.background) next.backgroundId = config.background;

  return next;
}

export function getSelectedAvatarItems(items: AvatarUiItem[], config: AvatarUiConfig) {
  return {
    hat: items.find((item) => item.id === config.hat),
    glasses: items.find((item) => item.id === config.glasses),
    skin: items.find((item) => item.id === config.skin),
    effect: items.find((item) => item.id === config.effect),
    background: items.find((item) => item.id === config.background),
  };
}
