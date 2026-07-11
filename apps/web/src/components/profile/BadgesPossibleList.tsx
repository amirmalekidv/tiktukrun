'use client';
import type { Badge } from './BadgesList';

interface BadgesPossibleListProps {
  badges: Badge[];
}

// Determine if icon is emoji or FontAwesome class name
function BadgeIconLocked({ icon }: { icon: string }) {
  if (/\p{Emoji}/u.test(icon)) {
    return <span className="text-2xl opacity-30">{icon}</span>;
  }
  return (
    <i
      className={`fas ${icon.startsWith('fa-') ? icon : `fa-${icon}`} text-2xl text-gray-600`}
    />
  );
}

export default function BadgesPossibleList({ badges }: BadgesPossibleListProps) {
  if (!badges || !badges.length) return null;

  return (
    <div className="dark-card rounded-xl p-5 border border-gray-800/40 bg-white/[0.03]">
      <h3 className="font-cinzel text-gray-500 text-sm mb-4 flex items-center gap-2">
        <i className="fas fa-lock" />
        نشان‌های قابل کسب
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex flex-col items-center gap-2"
            title={badge.description}
          >
            <div className="w-14 h-14 rounded-xl border-2 border-gray-800 flex items-center justify-center bg-gray-900/30 relative overflow-hidden">
              <div className="opacity-25">
                <BadgeIconLocked icon={badge.icon} />
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
                <i className="fas fa-lock text-gray-600 text-sm" />
              </div>
            </div>
            <span className="text-xs text-gray-600 font-vazir text-center line-clamp-1">
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
