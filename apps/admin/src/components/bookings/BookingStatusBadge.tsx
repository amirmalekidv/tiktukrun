import { StatusBadge } from '@/components/ui';
import type { BookingStatus } from '@/lib/types';

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <StatusBadge status={status} />;
}
