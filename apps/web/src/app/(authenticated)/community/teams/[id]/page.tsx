'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LiveChatPanel from '@/components/community/LiveChatPanel';
import { teamsApi } from '@/lib/api/teams';
import toast from 'react-hot-toast';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    teamsApi.getTeam(id).then((raw) => {
      const d = raw as { team?: unknown } | Record<string, unknown> | null;
      const teamData =
        d && typeof d === 'object' && 'team' in d ? (d as { team?: unknown }).team : d;
      setTeam(teamData ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleLeave = async () => {
    setLeaving(true);
    try { await teamsApi.leaveTeam(id); toast.success('از تیم خارج شدید'); router.push('/community'); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'خطا'); setLeaving(false); }
  };

  const t = team ?? { name: 'تیم نمونه', description: 'توضیحات تیم', currentMembers: 4, maxMembers: 6, gameType: 'فرار از اتاق' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-red-400"><i className="fas fa-arrow-right text-lg" /></button>
        <div className="flex-1">
          <h1 className="font-cinzel text-2xl text-red-500">{t.name}</h1>
          <p className="text-gray-500 font-vazir text-sm">{t.gameType} · {t.currentMembers}/{t.maxMembers} نفر</p>
        </div>
        <button onClick={handleLeave} disabled={leaving} className="px-4 py-2 border border-red-900/50 text-red-500 rounded-xl font-vazir text-sm hover:bg-red-900/20">
          {leaving ? <i className="fas fa-spinner fa-spin" /> : 'ترک تیم'}
        </button>
      </div>
      {t.description && <p className="text-gray-400 font-vazir text-sm bg-gray-900/30 p-4 rounded-xl border border-gray-800/30">{t.description}</p>}
      <LiveChatPanel roomType="team" teamId={id} title={`چت تیم ${t.name}`} />
    </motion.div>
  );
}
