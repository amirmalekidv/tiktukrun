'use client';
import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { wheelApi } from '@/lib/api/wheel';
import { calculateRotation, getPrizeIndexById } from '@/lib/wheel-engine';
import type { WheelPrize } from '@/lib/wheel-engine';
import toast from 'react-hot-toast';

export function useWheel() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<WheelPrize | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: prizesData, isLoading: prizesLoading } = useSWR(
    'wheel-prizes',
    () => wheelApi.getPrizes().catch(() => null)
  );

  const {
    data: eligibilityData,
    isLoading: eligLoading,
    mutate: refetchEligibility,
  } = useSWR(
    'wheel-eligibility',
    () => wheelApi.getEligibility().catch(() => null),
    { refreshInterval: 10000 }
  );

  const prizesPayload = prizesData as { prizes?: WheelPrize[] } | WheelPrize[] | null | undefined;
  const prizes: WheelPrize[] = Array.isArray(prizesPayload)
    ? prizesPayload
    : prizesPayload?.prizes ?? [];

  const spin = useCallback(
    async (paidWith: 'xp' | 'coins' | 'diamonds') => {
      if (isSpinning) return;

      const elig = eligibilityData as Record<string, boolean> | null | undefined;
      if (elig) {
        const keyMap = {
          xp: 'canSpinWithXp',
          coins: 'canSpinWithCoins',
          diamonds: 'canSpinWithDiamonds',
        } as const;
        const key = keyMap[paidWith];
        if (elig[key] === false) {
          toast.error('منبع کافی ندارید');
          return;
        }
      }

      setIsSpinning(true);
      try {
        const response = await wheelApi.spin(paidWith) as {
          prize?: WheelPrize;
          data?: { prize?: WheelPrize };
        };

        const prize: WheelPrize | null =
          response?.prize ?? response?.data?.prize ?? null;

        if (!prize) {
          throw new Error('نتیجه گردونه دریافت نشد');
        }

        const activePrizes = prizes.length > 0 ? prizes : [];
        const prizeIndex = activePrizes.length > 0
          ? getPrizeIndexById(prize.id, activePrizes)
          : 0;

        const totalSlices = Math.max(activePrizes.length, 8); // minimum 8 slices
        const newRotation = calculateRotation(prizeIndex, totalSlices, rotation);
        setRotation(newRotation);

        setTimeout(() => {
          setResult(prize);
          setShowModal(true);
          setIsSpinning(false);
          refetchEligibility();
        }, 5100);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطا در چرخش گردونه';
        toast.error(msg);
        setIsSpinning(false);
      }
    },
    [isSpinning, eligibilityData, prizes, rotation, refetchEligibility]
  );

  const closeModal = useCallback(() => {
    setShowModal(false);
    setResult(null);
  }, []);

  return {
    prizes,
    prizesLoading,
    eligibility: eligibilityData ?? null,
    eligLoading,
    rotation,
    isSpinning,
    result,
    showModal,
    spin,
    closeModal,
  };
}
