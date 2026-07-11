'use client';
import { motion } from 'framer-motion';
import type { AvatarTab, AvatarUiConfig, AvatarUiItem } from '@/lib/avatar-adapter';

interface AvatarPreviewProps {
  config: AvatarUiConfig;
  selectedItems?: Partial<Record<AvatarTab, AvatarUiItem | undefined>>;
  size?: 'sm' | 'md' | 'lg';
}

const BACKGROUNDS: Record<string, string> = {
  default: 'from-red-950 to-gray-900',
  forest: 'from-green-950 to-gray-900',
  ocean: 'from-blue-950 to-gray-900',
  fire: 'from-orange-950 to-red-950',
  void: 'from-purple-950 to-gray-900',
  cemetery: 'from-gray-800 to-gray-950',
};

const SIZES = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-44 h-44',
};

export default function AvatarPreview({
  config,
  selectedItems = {},
  size = 'md',
}: AvatarPreviewProps) {
  const backgroundCode = selectedItems.background?.code?.replace(/^background_/, '') ?? 'default';
  const bg = BACKGROUNDS[backgroundCode] ?? BACKGROUNDS.default;
  const hasEffect = Boolean(selectedItems.effect ?? config.effect);
  const hatIcon = selectedItems.hat?.icon;
  const glassesIcon = selectedItems.glasses?.icon;
  const effectIcon = selectedItems.effect?.icon;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Outer ring animation */}
        {hasEffect && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-red-600/40 -m-2"
          />
        )}

        <div
          className={`${SIZES[size]} rounded-full border-4 border-red-800 overflow-hidden relative bg-gradient-to-br ${bg} shadow-[0_0_30px_rgba(0,245,255,0.3)]`}
        >
          {/* Base skull icon */}
          <div className="w-full h-full flex items-center justify-center">
            <i
              className="fas fa-skull text-red-300"
              style={{
                fontSize: size === 'lg' ? '3rem' : size === 'md' ? '2rem' : '1.25rem',
                filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.6))',
              }}
            />
          </div>

          {/* Hat overlay */}
          {hatIcon && (
            <div className="absolute top-0 inset-x-0 flex justify-center pt-1">
              <span className="text-2xl" title={selectedItems.hat?.name}>
                {hatIcon}
              </span>
            </div>
          )}

          {/* Glasses overlay */}
          {glassesIcon && (
            <div className="absolute top-1/3 inset-x-0 flex justify-center">
              <span className="text-lg" title={selectedItems.glasses?.name}>
                {glassesIcon}
              </span>
            </div>
          )}

          {/* Effect badge */}
          {effectIcon && (
            <div className="absolute bottom-2 right-2 text-lg drop-shadow-[0_0_8px_rgba(0,245,255,0.7)]">
              {effectIcon}
            </div>
          )}
        </div>

        {/* Glow effect */}
        {hasEffect && (
          <div className="absolute inset-0 rounded-full animate-pulse bg-red-500/10" />
        )}
      </div>

      <div className="text-xs text-gray-500 font-vazir text-center">
        پیش‌نمایش آواتار
      </div>
    </div>
  );
}
