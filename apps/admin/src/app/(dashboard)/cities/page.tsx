'use client';
import { useState } from 'react';
import { Plus, Trash2, Edit, Check } from 'lucide-react';
import { SectionHeader, ConfirmDialog, Toggle } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const MOCK_CITIES = [
  { id: 'c1', name: 'تهران', slug: 'tehran', isActive: true, branchesCount: 3 },
  { id: 'c2', name: 'مشهد', slug: 'mashhad', isActive: true, branchesCount: 2 },
  { id: 'c3', name: 'اصفهان', slug: 'isfahan', isActive: true, branchesCount: 1 },
  { id: 'c4', name: 'شیراز', slug: 'shiraz', isActive: false, branchesCount: 0 },
];

export default function CitiesPage() {
  const [cities, setCities] = useState(MOCK_CITIES);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    setCities(prev => [...prev, {
      id: Date.now().toString(),
      name: newName,
      slug: newName,
      isActive: true,
      branchesCount: 0,
    }]);
    setNewName('');
    toast.success('شهر اضافه شد');
  };

  const handleEdit = (id: string) => {
    setCities(prev => prev.map(c => c.id === id ? { ...c, name: editName } : c));
    setEditId(null);
    toast.success('شهر ویرایش شد');
  };

  const handleToggle = (id: string) => {
    setCities(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت شهرها"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'شهرها' }]}
      />

      <div className="max-w-2xl space-y-6">
        {/* Add New City */}
        <div className="admin-card">
          <h3 className="section-title">افزودن شهر جدید</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="input-field flex-1"
              placeholder="نام شهر..."
            />
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="w-4 h-4" />
              افزودن
            </button>
          </div>
        </div>

        {/* Cities List */}
        <div className="admin-card">
          <h3 className="section-title">لیست شهرها ({persianNum(cities.length)})</h3>
          <div className="space-y-2">
            {cities.map(city => (
              <div key={city.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                <Toggle checked={city.isActive} onChange={() => handleToggle(city.id)} />
                <div className="flex-1">
                  {editId === city.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="input-field flex-1 py-1"
                        autoFocus
                      />
                      <button onClick={() => handleEdit(city.id)} className="btn-primary py-1 px-3">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-white font-medium">{city.name}</span>
                      <span className="text-slate-500 text-xs mr-3">{persianNum(city.branchesCount)} شعبه</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditId(city.id); setEditName(city.name); }}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(city.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"
                    disabled={city.branchesCount > 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          setCities(prev => prev.filter(c => c.id !== deleteId));
          toast.success('شهر حذف شد');
          setDeleteId(null);
        }}
        title="حذف شهر"
        description="آیا از حذف این شهر اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
