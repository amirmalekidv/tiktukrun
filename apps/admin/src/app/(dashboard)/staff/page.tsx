'use client';

import { useState } from 'react';
import { SectionHeader, Modal, ConfirmDialog, StatusBadge, Avatar } from '@/components/ui';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiLock, FiUnlock, FiMail, FiPhone, FiShield } from 'react-icons/fi';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleName: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  lastLogin: string;
  createdAt: string;
  department: string;
}

const MOCK_STAFF: StaffMember[] = [
  { id: '1', name: 'علی محمدی', email: 'ali@tiktakrun.ir', phone: '09121111111', role: 'admin', roleName: 'ادمین', status: 'active', lastLogin: '۲ ساعت پیش', createdAt: '۱۴۰۲/۰۱/۰۱', department: 'فناوری اطلاعات' },
  { id: '2', name: 'مریم احمدی', email: 'maryam@tiktakrun.ir', phone: '09122222222', role: 'operator', roleName: 'اپراتور', status: 'active', lastLogin: '۱ روز پیش', createdAt: '۱۴۰۲/۰۳/۱۵', department: 'عملیات' },
  { id: '3', name: 'رضا کریمی', email: 'reza@tiktakrun.ir', phone: '09123333333', role: 'accountant', roleName: 'حسابدار', status: 'active', lastLogin: '۳ روز پیش', createdAt: '۱۴۰۲/۰۴/۰۱', department: 'مالی' },
  { id: '4', name: 'فاطمه حسینی', email: 'fatemeh@tiktakrun.ir', phone: '09124444444', role: 'support', roleName: 'پشتیبانی', status: 'active', lastLogin: '۵ ساعت پیش', createdAt: '۱۴۰۲/۰۵/۱۰', department: 'پشتیبانی' },
  { id: '5', name: 'محمد رضایی', email: 'mohammad@tiktakrun.ir', phone: '09125555555', role: 'support', roleName: 'پشتیبانی', status: 'inactive', lastLogin: '۲ هفته پیش', createdAt: '۱۴۰۲/۰۶/۰۱', department: 'پشتیبانی' },
  { id: '6', name: 'زهرا نوری', email: 'zahra@tiktakrun.ir', phone: '09126666666', role: 'operator', roleName: 'اپراتور', status: 'suspended', lastLogin: '۱ ماه پیش', createdAt: '۱۴۰۲/۰۷/۱۵', department: 'عملیات' },
];

const ROLES = ['admin', 'operator', 'accountant', 'support'];
const ROLE_LABELS: Record<string, string> = { admin: 'ادمین', operator: 'اپراتور', accountant: 'حسابدار', support: 'پشتیبانی' };
const STATUS_MAP: Record<string, string> = { active: 'فعال', inactive: 'غیرفعال', suspended: 'تعلیق' };
const STATUS_COLOR: Record<string, string> = { active: 'success', inactive: 'default', suspended: 'danger' };

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'support', department: '', password: '' });

  const filtered = staff.filter(s => {
    const matchSearch = s.name.includes(search) || s.email.includes(search) || s.phone.includes(search);
    const matchRole = !filterRole || s.role === filterRole;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const openCreate = () => {
    setEditStaff(null);
    setFormData({ name: '', email: '', phone: '', role: 'support', department: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditStaff(s);
    setFormData({ name: s.name, email: s.email, phone: s.phone, role: s.role, department: s.department, password: '' });
    setShowModal(true);
  };

  const saveStaff = () => {
    if (editStaff) {
      setStaff(prev => prev.map(s => s.id === editStaff.id ? { ...s, ...formData, roleName: ROLE_LABELS[formData.role] } : s));
    } else {
      const newS: StaffMember = {
        id: Date.now().toString(),
        ...formData,
        roleName: ROLE_LABELS[formData.role],
        status: 'active',
        lastLogin: 'هنوز وارد نشده',
        createdAt: new Date().toLocaleDateString('fa-IR'),
      };
      setStaff(prev => [...prev, newS]);
    }
    setShowModal(false);
  };

  const toggleStatus = (s: StaffMember) => {
    setStaff(prev => prev.map(m => m.id === s.id ? { ...m, status: m.status === 'active' ? 'suspended' : 'active' } : m));
  };

  const deleteStaff = () => {
    if (staffToDelete) setStaff(prev => prev.filter(s => s.id !== staffToDelete.id));
    setShowDeleteDialog(false);
  };

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    suspended: staff.filter(s => s.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مدیریت کارمندان"
        subtitle="افزودن، ویرایش و مدیریت دسترسی کارمندان ادمین"
        icon={<FiUsers />}
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2">
            <FiPlus className="w-4 h-4" />
            کارمند جدید
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">کل کارمندان</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">فعال</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">تعلیق</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.suspended}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو نام، ایمیل، تلفن..."
          className="input-field flex-1 min-w-48"
        />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-field">
          <option value="">همه نقش‌ها</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="suspended">تعلیق</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-right text-slate-400 text-sm font-medium p-4">کارمند</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">تماس</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">نقش</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">واحد</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">وضعیت</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">آخرین ورود</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size="sm" />
                    <div>
                      <p className="text-white font-medium text-sm">{s.name}</p>
                      <p className="text-slate-500 text-xs">#{s.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                      <FiMail className="w-3 h-3 text-slate-500" />
                      {s.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                      <FiPhone className="w-3 h-3 text-slate-500" />
                      {s.phone}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <FiShield className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-slate-300 text-sm">{s.roleName}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-slate-300 text-sm">{s.department}</span>
                </td>
                <td className="p-4">
                  <StatusBadge status={STATUS_COLOR[s.status] as any} label={STATUS_MAP[s.status]} />
                </td>
                <td className="p-4">
                  <span className="text-slate-400 text-sm">{s.lastLogin}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors">
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleStatus(s)}
                      className={`p-1.5 rounded transition-colors ${s.status === 'active' ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10' : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'}`}
                    >
                      {s.status === 'active' ? <FiLock className="w-3.5 h-3.5" /> : <FiUnlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { setStaffToDelete(s); setShowDeleteDialog(true); }}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">هیچ کارمندی یافت نشد</div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editStaff ? 'ویرایش کارمند' : 'کارمند جدید'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">نام و نام خانوادگی</label>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">شماره موبایل</label>
              <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">ایمیل</label>
              <input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} type="email" className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">نقش</label>
              <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="input-field w-full">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">واحد/دپارتمان</label>
              <input value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">{editStaff ? 'رمز جدید (اختیاری)' : 'رمز عبور'}</label>
              <input value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} type="password" className="input-field w-full" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">لغو</button>
            <button onClick={saveStaff} className="btn-primary px-6 py-2">{editStaff ? 'ذخیره' : 'ایجاد'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={deleteStaff}
        title="حذف کارمند"
        message={`آیا از حذف "${staffToDelete?.name}" مطمئن هستید؟`}
        confirmText="حذف"
        type="danger"
      />
    </div>
  );
}
