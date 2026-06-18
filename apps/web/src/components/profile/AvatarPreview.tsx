'use client';
import { motion } from 'framer-motion';

export interface AvatarConfig {
  skin?: string;
  hat?: string;
  glasses?: string;
  effect?: string;
  background?: string;
}

interface AvatarPreviewProps {
  config: AvatarConfig;
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
  size = 'md',
}: AvatarPreviewProps) {
  const bg = BACKGROUNDS[config.background ?? 'default'] ?? BACKGROUNDS.default;
  const hasEffect = config.effect && config.effect !== 'none';

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
          className={`${SIZES[size]} rounded-full border-4 border-red-800 overflow-hidden relative bg-gradient-to-br ${bg} shadow-[0_0_30px_rgba(220,38,38,0.3)]`}
        >
          {/* Base skull icon */}
          <div className="w-full h-full flex items-center justify-center">
            <i
              className="fas fa-skull text-red-300"
              style={{
                fontSize: size === 'lg' ? '3rem' : size === 'md' ? '2rem' : '1.25rem',
                filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.6))',
              }}
            />
          </div>

          {/* Hat overlay */}
          {config.hat && config.hat !== 'none' && (
            <div className="absolute top-0 inset-x-0 flex justify-center pt-1">
              <span className="text-2xl" title={config.hat}>
                {config.hat === 'witch' ? '🎩' : config.hat === 'crown' ? '👑' : config.hat === 'horns' ? '😈' : '🎃'}
              </span>
            </div>
          )}

          {/* Glasses overlay */}
          {config.glasses && config.glasses !== 'none' && (
            <div className="absolute top-1/3 inset-x-0 flex justify-center">
              <span className="text-lg" title={config.glasses}>
                {config.glasses === 'spectral' ? '👓' : '🕶️'}
              </span>
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
