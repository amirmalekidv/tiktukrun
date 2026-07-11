'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [notifPrefs, setNotifPrefs] = useState({ booking: true, wallet: true, team: true, system: false });
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const BASE = process.env.NEXT_PUBLIC_API_URL || '';
  const ah = (): Record<string, string> => { if (typeof window === 'undefined') return {}; const t = localStorage.getItem('auth_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

  const saveNotifs = async () => {
    setSaving(true);
    try { await fetch(`${BASE}/api/v1/settings/notifications`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...ah() }, body: JSON.stringify(notifPrefs) }); toast.success('تنظیمات ذخیره شد'); }
    catch { toast.error('خطا'); } finally { setSaving(false); }
  };

  const changePw = async () => {
    if (!currentPw || !newPw || newPw.length < 6) { toast.error('رمز جدید باید حداقل ۶ کاراکتر باشد'); return; }
    setSaving(true);
    try { await fetch(`${BASE}/api/v1/settings/password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...ah() }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) }); toast.success('رمز تغییر کرد'); setCurrentPw(''); setNewPw(''); }
    catch { toast.error('رمز فعلی اشتباه است'); } finally { setSaving(false); }
  };

  const ic = 'w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-vazir text-sm focus:outline-none focus:border-red-600 transition-colors';
  const notifItems = [{ key: 'booking', label: 'اعلان رزروها' }, { key: 'wallet', label: 'اعلان کیف پول' }, { key: 'team', label: 'اعلان تیم' }, { key: 'system', label: 'اعلان سیستم' }];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto space-y-6">
      <div><h1 className="font-cinzel text-2xl text-red-500">تنظیمات</h1><p className="text-gray-500 font-vazir text-sm mt-1">مدیریت حساب کاربری</p></div>

      <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-white/[0.03]">
        <h2 className="font-cinzel text-sm text-red-400 mb-4"><i className="fas fa-bell ml-2" />تنظیمات اعلان</h2>
        <div className="space-y-3">{notifItems.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-300 font-vazir">{label}</span>
            <button onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
              className={`w-12 h-6 rounded-full transition-all relative ${notifPrefs[key as keyof typeof notifPrefs] ? 'bg-red-700' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${notifPrefs[key as keyof typeof notifPrefs] ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        ))}</div>
        <button onClick={saveNotifs} disabled={saving} className="w-full mt-4 py-2.5 bg-red-900/30 border border-red-700/40 text-red-400 rounded-xl font-vazir text-sm hover:bg-red-800/40">{saving ? 'ذخیره...' : 'ذخیره تنظیمات'}</button>
      </div>

      <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-white/[0.03]">
        <h2 className="font-cinzel text-sm text-red-400 mb-4"><i className="fas fa-lock ml-2" />تغییر رمز عبور</h2>
        <div className="space-y-3">
          <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={ic} placeholder="رمز فعلی" dir="ltr" />
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className={ic} placeholder="رمز جدید (حداقل ۶ کاراکتر)" dir="ltr" />
        </div>
        <button onClick={changePw} disabled={saving} className="w-full mt-4 py-2.5 bg-red-900/30 border border-red-700/40 text-red-400 rounded-xl font-vazir text-sm hover:bg-red-800/40">تغییر رمز</button>
      </div>

      <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-white/[0.03]">
        <h2 className="font-cinzel text-sm text-red-400 mb-4"><i className="fas fa-sign-out-alt ml-2" />خروج از حساب</h2>
        <button onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('auth_token'); window.location.href = '/login'; } }}
          className="w-full py-2.5 border border-red-900/50 text-red-500 rounded-xl font-vazir text-sm hover:bg-red-900/20">خروج از حساب کاربری</button>
      </div>
    </motion.div>
  );
}
