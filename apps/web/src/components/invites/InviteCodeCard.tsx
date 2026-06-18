'use client';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
interface InviteCodeCardProps { code: string; shareLink: string; }
export default function InviteCodeCard({ code, shareLink }: InviteCodeCardProps) {
  const copy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success(`${label} کپی شد!`))
        .catch(() => toast.error('کپی ناموفق بود'));
    } else {
      // Fallback for non-secure context
      try {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        toast.success(`${label} کپی شد!`);
      } catch {
        toast.error('کپی ناموفق بود');
      }
    }
  };
  return (
    <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-[#0d0d0d] text-center">
      <i className="fas fa-ticket-alt text-4xl text-red-500 mb-4" />
      <h3 className="font-cinzel text-lg text-white mb-2">کد دعوت اختصاصی</h3>
      <div className="bg-gray-900/60 border-2 border-dashed border-red-800/50 rounded-xl p-4 mb-4">
        <span className="font-cinzel text-3xl tracking-[0.3em] text-red-400">{code || 'LOADING'}</span>
      </div>
      <div className="flex gap-3">
        <button onClick={() => copy(code, 'کد')} className="flex-1 py-2.5 bg-red-900/30 border border-red-700/40 text-red-400 rounded-xl font-vazir text-sm hover:bg-red-800/40"><i className="fas fa-copy ml-1" />کپی کد</button>
        <button onClick={() => copy(shareLink, 'لینک')} className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl font-vazir text-sm hover:bg-gray-900"><i className="fas fa-share-alt ml-1" />کپی لینک</button>
      </div>
    </div>
  );
}
