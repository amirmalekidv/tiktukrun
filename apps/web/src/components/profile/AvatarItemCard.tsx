'use client';
import { motion } from 'framer-motion';
import type { AvatarUiItem as AvatarItem } from '@/lib/avatar-adapter';

interface AvatarItemCardProps {
  item: AvatarItem;
  onPurchase?: (item: AvatarItem) => void;
  onSelect?: (item: AvatarItem) => void;
  isSelected?: boolean;
}

export default function AvatarItemCard({
  item,
  onPurchase,
  onSelect,
  isSelected,
}: AvatarItemCardProps) {
  const isLocked = item.status === 'locked';
  const isPurchased = item.status === 'purchased' || item.status === 'active';
  const isActive = item.status === 'active';

  const handleClick = () => {
    if (isLocked) {
      onPurchase?.(item);
    } else {
      onSelect?.(item);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={`
        relative rounded-xl border-2 p-3 cursor-pointer transition-all text-center
        ${isSelected || isActive
          ? 'border-red-500 bg-red-900/20 shadow-[0_0_16px_rgba(220,38,38,0.3)]'
          : isLocked
          ? 'border-gray-700/50 bg-gray-900/30 opacity-70'
          : 'border-red-900/30 bg-[#0d0d0d] hover:border-red-700/50'
        }
      `}
    >
      {/* Status badge */}
      <div className="absolute top-1.5 right-1.5">
        {isActive && (
          <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-cinzel">
            فعال
          </span>
        )}
        {isPurchased && !isActive && (
          <i className="fas fa-check-circle text-green-500 text-xs" />
        )}
        {isLocked && (
          <i className="fas fa-lock text-gray-600 text-xs" />
        )}
      </div>

      {/* Icon */}
      <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-gray-900/60 mb-2 text-2xl">
        {item.icon}
      </div>

      {/* Name */}
      <div className="text-xs font-vazir text-gray-300 line-clamp-1 mb-1">
        {item.name}
      </div>

      {/* Price */}
      {isLocked && (
        <div className="flex items-center justify-center gap-1 text-[11px]">
          <i className="fas fa-gem text-cyan-400 text-xs" />
          <span className="text-cyan-400 font-cinzel">{item.diamondCost}</span>
        </div>
      )}
    </motion.div>
  );
}
