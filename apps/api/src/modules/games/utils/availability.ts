import { DateTime } from 'luxon';

export const SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
export const TEHRAN_TZ = 'Asia/Tehran';

interface AvailabilityGame {
  id: string;
  durationMinutes: number;
  pricePerPerson?: bigint | number | string;
}

interface AvailabilityBooking {
  gameId?: string | null;
  slotDateTime: Date;
}

export function getAvailabilityDayStart(dateStr?: string): DateTime {
  const date = dateStr || DateTime.now().setZone(TEHRAN_TZ).toISODate();
  return DateTime.fromISO(date || '', { zone: TEHRAN_TZ }).startOf('day');
}

export function buildAvailabilitySlots(
  game: Pick<AvailabilityGame, 'durationMinutes' | 'pricePerPerson'>,
  bookings: Pick<AvailabilityBooking, 'slotDateTime'>[],
  maxConcurrent: number,
  dayStart: DateTime,
  now = DateTime.now().setZone(TEHRAN_TZ),
) {
  return SLOT_HOURS.map((hour) => {
    const slotTime = dayStart.set({ hour, minute: 0, second: 0, millisecond: 0 });
    const slotJSDate = slotTime.toJSDate();
    const slotEndTime = slotTime.plus({ minutes: game.durationMinutes });

    const bookingsInSlot = bookings.filter(
      (b) => Math.abs(b.slotDateTime.getTime() - slotJSDate.getTime()) < 1000,
    );

    const bookedCount = bookingsInSlot.length;
    const remainingSlots = Math.max(0, maxConcurrent - bookedCount);
    const available = remainingSlots > 0 && slotTime > now;
    const slotId = slotJSDate.toISOString();

    return {
      id: slotId,
      slotDateTime: slotId,
      startTime: slotTime.toFormat('HH:mm'),
      endTime: slotEndTime.toFormat('HH:mm'),
      hour,
      price: Number(game.pricePerPerson ?? 0),
      available,
      isAvailable: available,
      bookedCount,
      remainingSlots,
      availableCapacity: remainingSlots,
      totalCapacity: maxConcurrent,
    };
  });
}

export function attachAvailableSlotCounts<T extends AvailabilityGame>(
  games: T[],
  bookings: AvailabilityBooking[],
  maxConcurrent: number,
  dayStart: DateTime,
) {
  const bookingsByGameId = bookings.reduce<Record<string, AvailabilityBooking[]>>((acc, booking) => {
    if (!booking.gameId) return acc;
    acc[booking.gameId] = acc[booking.gameId] ?? [];
    acc[booking.gameId].push(booking);
    return acc;
  }, {});

  const now = DateTime.now().setZone(TEHRAN_TZ);

  return games.map((game) => {
    const slots = buildAvailabilitySlots(
      game,
      bookingsByGameId[game.id] ?? [],
      maxConcurrent,
      dayStart,
      now,
    );

    return {
      ...game,
      availableSlots: slots.filter((slot) => slot.isAvailable).length,
    };
  });
}
