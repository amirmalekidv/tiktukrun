import React, { useState } from 'react';

export interface HelpIconProps {
  tooltip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * HelpIcon — دقیقاً مشابه demo2 EscapeVerse
 * <span class="help-icon">?<span class="help-tooltip">...</span></span>
 */
export const HelpIcon: React.FC<HelpIconProps> = ({ tooltip, position = 'top', className = '' }) => {
  const [visible, setVisible] = useState(false);

  const posMap = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-[rgba(127,29,29,0.3)] border border-[rgba(127,29,29,0.5)] text-primary text-xs font-bold cursor-help select-none ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      aria-label="راهنما"
    >
      ?
      {visible && (
        <span
          className={`absolute z-50 ${posMap[position]} w-48 px-3 py-2 text-xs text-text-primary bg-[#1a0505] border border-[rgba(127,29,29,0.6)] rounded-lg shadow-blood whitespace-normal text-right leading-relaxed`}
          role="tooltip"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
};
