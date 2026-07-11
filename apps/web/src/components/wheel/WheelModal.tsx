'use client';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WheelPrize } from '@/lib/wheel-engine';
import { formatPrizeValue, getPrizeDisplay } from '@/lib/wheel-adapter';

// Pre-generate particle offsets to avoid hydration mismatch from Math.random() in render
const PARTICLE_OFFSETS = [
  { x: '70%', y: '20%' }, { x: '30%', y: '15%' }, { x: '85%', y: '60%' },
  { x: '15%', y: '65%' }, { x: '60%', y: '85%' }, { x: '40%', y: '90%' },
];

interface WheelModalProps {
  prize: WheelPrize | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WheelModal({ prize, isOpen, onClose }: WheelModalProps) {
  if (!prize) return null;
  const cfg = getPrizeDisplay(prize.type);
  const isNothing = prize.type === 'nothing';
  const valueText = formatPrizeValue(prize);
  // Memoize so particles don't re-randomize on re-render (hydration safety)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const particles = useMemo(() => PARTICLE_OFFSETS, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="dark-card relative max-w-sm w-full overflow-hidden rounded-[20px] p-8 text-center shadow-[0_0_60px_rgba(0,245,255,0.2)]"
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 opacity-5 rounded-3xl"
              style={{ background: `radial-gradient(circle, ${cfg.color}, transparent)` }}
            />

            {/* Particles (pre-computed positions to avoid hydration mismatch) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {particles.map((pos, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: pos.x,
                    y: pos.y,
                  }}
                  transition={{ delay: i * 0.1, duration: 1, repeat: 2 }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ background: cfg.color }}
                />
              ))}
            </div>

            <div className="relative">
              {/* Prize icon */}
              <motion.div
                animate={isNothing ? {} : { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: 2, duration: 0.4 }}
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-5xl mx-auto mb-6"
                style={{
                  borderColor: cfg.color,
                  background: cfg.color + '20',
                  boxShadow: `0 0 40px ${cfg.color}50`,
                  color: cfg.color,
                }}
              >
                <i className={`fas ${cfg.icon}`} />
              </motion.div>

              <h2 className="font-cinzel text-2xl text-white mb-2">
                {isNothing ? 'این بار نشد!' : 'تبریک! 🎉'}
              </h2>

              {!isNothing && valueText && (
                <div className="mb-2">
                  <span className="font-cinzel text-3xl font-bold" style={{ color: cfg.color }}>
                    {valueText}
                  </span>
                  {prize.type !== 'discount' && (
                    <span className="text-gray-400 font-vazir text-lg mr-2">{cfg.label}</span>
                  )}
                </div>
              )}

              <p className="text-gray-400 font-vazir text-sm mb-2">{prize.label}</p>

              {isNothing && (
                <p className="text-gray-600 font-vazir text-sm mb-4">
                  شانس دفعه بعد بهتر خواهد بود!
                </p>
              )}

              <button
                onClick={onClose}
                className="btn-blood mt-4 w-full py-3 font-vazir font-bold"
              >
                <i className="fas fa-check ml-2" />
                متوجه شدم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
