import { redirect } from 'next/navigation'

export default function SegmentDetailPage({ params }: { params: { id: string } }) {
  redirect('/segments')
}
