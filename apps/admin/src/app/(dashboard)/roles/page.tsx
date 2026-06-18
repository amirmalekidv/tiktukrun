'use client';

import { useState } from 'react';
import { SectionHeader, Modal, ConfirmDialog } from '@/components/ui';
import { FiShield, FiPlus, FiEdit2, FiTrash2, FiUsers, FiCheck } from 'react-icons/fi';

interface Permission {
  id: string;
  label: string;
  group: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  usersCount: number;
  isSystem: boolean;
  createdAt: string;
}

const ALL_PERMISSIONS: Permission[] = [
  // Bookings
  { id: 'bookings.view', label: 'مشاهده رزروها', group: 'رزروها' },
  { id: 'bookings.create', label: 'ایجاد رزرو', group: 'رزروها' },
  { id: 'bookings.edit', label: 'ویرایش رزرو', group: 'رزروها' },
  { id: 'bookings.cancel', label: 'لغو رزرو', group: 'رزروها' },
  { id: 'bookings.refund', label: 'استرداد وجه', group: 'رزروها' },
  // Games
  { id: 'games.view', label: 'مشاهده بازی‌ها', group: 'بازی‌ها' },
  { id: 'games.create', label: 'ایجاد بازی', group: 'بازی‌ها' },
  { id: 'games.edit', label: 'ویرایش بازی', group: 'بازی‌ها' },
  { id: 'games.delete', label: 'حذف بازی', group: 'بازی‌ها' },
  // Users
  { id: 'users.view', label: 'مشاهده کاربران', group: 'کاربران' },
  { id: 'users.edit', label: 'ویرایش کاربران', group: 'کاربران' },
  { id: 'users.ban', label: 'مسدود کردن', group: 'کاربران' },
  // Finance
  { id: 'finance.view', label: 'مشاهده مالی', group: 'مالی' },
  { id: 'finance.reports', label: 'گزارشات مالی', group: 'مالی' },
  { id: 'finance.withdrawal', label: 'تأیید برداشت', group: 'مالی' },
  // Settings
  { id: 'settings.view', label: 'مشاهده تنظیمات', group: 'تنظیمات' },
  { id: 'settings.edit', label: 'ویرایش تنظیمات', group: 'تنظیمات' },
  // Tickets
  { id: 'tickets.view', label: 'مشاهده تیکت‌ها', group: 'تیکت‌ها' },
  { id: 'tickets.reply', label: 'پاسخ تیکت', group: 'تیکت‌ها' },
  { id: 'tickets.close', label: 'بستن تیکت', group: 'تیکت‌ها' },
  // Reports
  { id: 'reports.view', label: 'مشاهده گزارشات', group: 'گزارشات' },
  { id: 'reports.export', label: 'خروجی Excel/PDF', group: 'گزارشات' },
  // Admin
  { id: 'roles.manage', label: 'مدیریت نقش‌ها', group: 'ادمین' },
  { id: 'staff.manage', label: 'مدیریت کارمندان', group: 'ادمین' },
  { id: 'audit.view', label: 'مشاهده لاگ ممیزی', group: 'ادمین' },
];

const MOCK_ROLES: Role[] = [
  {
    id: '1',
    name: 'super_admin',
    displayName: 'سوپر ادمین',
    description: 'دسترسی کامل به تمام بخش‌ها',
    permissions: ALL_PERMISSIONS.map(p => p.id),
    usersCount: 1,
    isSystem: true,
    createdAt: '1402/01/01',
  },
  {
    id: '2',
    name: 'admin',
    displayName: 'ادمین',
    description: 'مدیر کلی سیستم',
    permissions: ALL_PERMISSIONS.filter(p => !p.id.includes('roles.manage')).map(p => p.id),
    usersCount: 3,
    isSystem: true,
    createdAt: '1402/01/01',
  },
  {
    id: '3',
    name: 'operator',
    displayName: 'اپراتور',
    description: 'مدیریت رزروها و تیکت‌ها',
    permissions: ['bookings.view', 'bookings.edit', 'tickets.view', 'tickets.reply', 'tickets.close'],
    usersCount: 8,
    isSystem: false,
    createdAt: '1402/03/15',
  },
  {
    id: '4',
    name: 'accountant',
    displayName: 'حسابدار',
    description: 'دسترسی به گزارشات مالی',
    permissions: ['finance.view', 'finance.reports', 'reports.view', 'reports.export'],
    usersCount: 2,
    isSystem: false,
    createdAt: '1402/04/01',
  },
  {
    id: '5',
    name: 'support',
    displayName: 'پشتیبانی',
    description: 'چت و تیکت کاربران',
    permissions: ['tickets.view', 'tickets.reply', 'bookings.view', 'users.view'],
    usersCount: 5,
    isSystem: false,
    createdAt: '1402/05/10',
  },
];

const permissionGroups = Array.from(new Set(ALL_PERMISSIONS.map(p => p.group)));

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [editingPerms, setEditingPerms] = useState<string[]>([]);
  const [formData, setFormData] = useState({ displayName: '', description: '' });

  const openCreate = () => {
    setSelectedRole(null);
    setEditingPerms([]);
    setFormData({ displayName: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setSelectedRole(role);
    setEditingPerms([...role.permissions]);
    setFormData({ displayName: role.displayName, description: role.description });
    setShowModal(true);
  };

  const togglePerm = (permId: string) => {
    setEditingPerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const toggleGroup = (group: string) => {
    const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.id);
    const allSelected = groupPerms.every(p => editingPerms.includes(p));
    if (allSelected) {
      setEditingPerms(prev => prev.filter(p => !groupPerms.includes(p)));
    } else {
      setEditingPerms(prev => Array.from(new Set([...prev, ...groupPerms])));
    }
  };

  const saveRole = () => {
    if (selectedRole) {
      setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, ...formData, permissions: editingPerms } : r));
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        name: formData.displayName.toLowerCase().replace(/\s+/g, '_'),
        displayName: formData.displayName,
        description: formData.description,
        permissions: editingPerms,
        usersCount: 0,
        isSystem: false,
        createdAt: new Date().toLocaleDateString('fa-IR'),
      };
      setRoles(prev => [...prev, newRole]);
    }
    setShowModal(false);
  };

  const deleteRole = () => {
    if (roleToDelete) {
      setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
    }
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مدیریت نقش‌ها"
        subtitle="تعریف و مدیریت سطوح دسترسی کارمندان"
        icon={<FiShield />}
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2">
            <FiPlus className="w-4 h-4" />
            نقش جدید
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map(role => (
          <div key={role.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.isSystem ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                  <FiShield className={`w-5 h-5 ${role.isSystem ? 'text-red-400' : 'text-blue-400'}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{role.displayName}</h3>
                  <p className="text-slate-500 text-xs">{role.name}</p>
                </div>
              </div>
              {role.isSystem && (
                <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">سیستمی</span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-4">{role.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <FiUsers className="w-4 h-4" />
                <span>{role.usersCount} کاربر</span>
                <span className="text-slate-600">•</span>
                <span>{role.permissions.length} دسترسی</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(role)}
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => { setRoleToDelete(role); setShowDeleteDialog(true); }}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedRole ? 'ویرایش نقش' : 'نقش جدید'} size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">نام نمایشی</label>
              <input
                value={formData.displayName}
                onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))}
                className="input-field w-full"
                placeholder="مثال: اپراتور"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">توضیح</label>
              <input
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>

          <div>
            <p className="text-white font-medium mb-3">دسترسی‌ها ({editingPerms.length} از {ALL_PERMISSIONS.length})</p>
            <div className="space-y-3 max-h-80 overflow-y-auto pl-1">
              {permissionGroups.map(group => {
                const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
                const selectedCount = groupPerms.filter(p => editingPerms.includes(p.id)).length;
                const allSelected = selectedCount === groupPerms.length;
                return (
                  <div key={group} className="bg-slate-750 rounded-lg border border-slate-600 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700"
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${allSelected ? 'bg-green-500 border-green-500' : selectedCount > 0 ? 'border-yellow-500' : 'border-slate-500'}`}>
                          {allSelected && <FiCheck className="w-3 h-3 text-white" />}
                          {!allSelected && selectedCount > 0 && <div className="w-2 h-2 bg-yellow-500 rounded-sm" />}
                        </div>
                        <span className="text-white font-medium text-sm">{group}</span>
                      </div>
                      <span className="text-slate-400 text-xs">{selectedCount}/{groupPerms.length}</span>
                    </div>
                    <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                      {groupPerms.map(perm => (
                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700">
                          <input
                            type="checkbox"
                            checked={editingPerms.includes(perm.id)}
                            onChange={() => togglePerm(perm.id)}
                            className="w-3.5 h-3.5 accent-red-500"
                          />
                          <span className="text-slate-300 text-xs">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
              لغو
            </button>
            <button onClick={saveRole} className="btn-primary px-6 py-2">
              {selectedRole ? 'ذخیره تغییرات' : 'ایجاد نقش'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={deleteRole}
        title="حذف نقش"
        message={`آیا از حذف نقش "${roleToDelete?.displayName}" مطمئن هستید؟ این عمل قابل بازگشت نیست.`}
        confirmText="حذف"
        type="danger"
      />
    </div>
  );
}
