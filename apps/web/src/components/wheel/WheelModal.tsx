'use client';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WheelPrize } from '@/lib/wheel-engine';

const PRIZE_ICONS = {
  xp: { icon: 'fa-bolt', color: '#8b5cf6', label: 'XP' },
  coins: { icon: 'fa-circle', color: '#f59e0b', label: 'سکه' },
  diamonds: { icon: 'fa-gem', color: '#22d3ee', label: 'الماس' },
  item: { icon: 'fa-gift', color: '#ec4899', label: 'آیتم' },
  nothing: { icon: 'fa-ghost', color: '#6b7280', label: 'دفعه بعد!' },
};

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
  const cfg = PRIZE_ICONS[prize.type] ?? PRIZE_ICONS.nothing;
  const isNothing = prize.type === 'nothing';
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
            className="relative bg-gradient-to-br from-[#1a0808] to-[#0d0d0d] border border-red-900/50 rounded-3xl p-8 max-w-sm w-full text-center overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.3)]"
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

              {!isNothing && (
                <div className="mb-2">
                  <span className="font-cinzel text-3xl font-bold" style={{ color: cfg.color }}>
                    +{prize.value.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-gray-400 font-vazir text-lg mr-2">{cfg.label}</span>
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
                className="w-full py-3 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-vazir font-bold rounded-xl transition-all mt-4"
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
