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
    <div className="dark-card rounded-[18px] p-6 text-center">
      <i className="fas fa-ticket-alt text-4xl text-[#00f5ff] mb-4" />
      <h3 className="font-cinzel text-lg text-white mb-2">کد دعوت اختصاصی</h3>
      <div className="bg-white/[0.04] border-2 border-dashed border-[#00f5ff]/40 rounded-xl p-4 mb-4">
        <span className="font-cinzel text-3xl text-[#00f5ff]">{code || 'LOADING'}</span>
      </div>
      <div className="flex gap-3">
        <button onClick={() => copy(code, 'کد')} className="btn-blood flex-1 py-2.5 text-sm"><i className="fas fa-copy ml-1" />کپی کد</button>
        <button onClick={() => copy(shareLink, 'لینک')} className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl font-vazir text-sm hover:bg-gray-900"><i className="fas fa-share-alt ml-1" />کپی لینک</button>
      </div>
    </div>
  );
}
