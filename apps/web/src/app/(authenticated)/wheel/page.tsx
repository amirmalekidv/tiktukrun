'use client';
import { motion } from 'framer-motion';
import LuxuryWheel from '@/components/wheel/LuxuryWheel';
import WheelButtons from '@/components/wheel/WheelButtons';
import WheelModal from '@/components/wheel/WheelModal';
import { useWheel } from '@/hooks/useWheel';

export default function WheelPage() {
  const {
    prizes,
    prizesLoading,
    eligibility,
    rotation,
    isSpinning,
    result,
    showModal,
    spin,
    closeModal,
  } = useWheel();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="font-cinzel text-3xl text-white mb-2">
          <span className="gradient-text">
          گردونه شانس
          </span>
        </h1>
        <p className="text-gray-500 font-vazir text-sm">
          یکی از روش‌های زیر را انتخاب کنید و بچرخانید
        </p>
      </div>

      {/* Wheel */}
      <div className="relative">
        {/* Glow backdrop */}
        <div className="absolute inset-0 rounded-full bg-[#00f5ff]/20 opacity-60 blur-3xl" />
        {prizesLoading ? (
          <div className="w-full max-w-[340px] mx-auto aspect-square rounded-full bg-gray-900/50 animate-pulse border border-white/10" />
        ) : (
          <LuxuryWheel
            prizes={prizes}
            rotation={rotation}
            isSpinning={isSpinning}
          />
        )}

        {/* Spinning overlay text */}
        {isSpinning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 left-0 right-0 text-center"
          >
            <span className="text-[#00f5ff] font-vazir text-sm animate-pulse">
              در حال چرخش...
            </span>
          </motion.div>
        )}
      </div>

      {/* Spin buttons */}
      <div className="dark-card rounded-[18px] p-6">
        <p className="text-center text-xs text-gray-500 font-vazir mb-4">
          روش پرداخت را انتخاب کنید:
        </p>
        <WheelButtons
          onSpin={spin}
          isSpinning={isSpinning}
          eligibility={eligibility}
        />
      </div>

      {/* Rules */}
      <div className="dark-card rounded-[18px] p-5">
        <h3 className="font-cinzel text-[#00f5ff] text-sm mb-3 flex items-center gap-2">
          <i className="fas fa-scroll" />
          قوانین گردونه
        </h3>
        <ul className="space-y-2 text-xs text-gray-500 font-vazir">
          <li className="flex items-start gap-2">
            <i className="fas fa-chevron-left text-[#00f5ff] mt-0.5" />
            هر چرخش با XP: ۲۰ XP از موجودی کسر می‌شود
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-chevron-left text-[#00f5ff] mt-0.5" />
            هر چرخش با سکه: ۵۰۰ سکه از موجودی کسر می‌شود
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-chevron-left text-[#00f5ff] mt-0.5" />
            هر چرخش با الماس: ۵ الماس از موجودی کسر می‌شود
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-chevron-left text-[#00f5ff] mt-0.5" />
            نتیجه گردونه توسط سرور تعیین می‌شود و قطعی است
          </li>
        </ul>
      </div>

      {/* Result Modal */}
      <WheelModal prize={result} isOpen={showModal} onClose={closeModal} />
    </motion.div>
  );
}
