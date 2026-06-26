'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Grid, List, Star, Edit, Trash2, ToggleLeft, Bookmark, RefreshCw } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Toggle, ConfirmDialog, Pagination, EmptyState } from '@/components/ui';
import { formatToman, persianNum, FEAR_EMOJIS, fearLabel } from '@/lib/utils/format';
import { gamesApi } from '@/lib/api';
import { readPaginatedList } from '@/lib/api/pagination';
import toast from 'react-hot-toast';
import type { Game } from '@/lib/types';
import { GAME_TIER_FA, GAME_TIER_STYLE } from '@/lib/types';
import { Gamepad2, TrendingUp, BookOpen } from 'lucide-react';

type ViewMode = 'table' | 'grid';

export default function GamesPage() {
  const [view, setView] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadGames = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (activeFilter) params.isActive = activeFilter === 'active' ? 'true' : 'false';
      const res = await gamesApi.getAll(params);
      const { items, total: count } = readPaginatedList<Game>(res);
      setGames(items);
      setTotal(count);
    } catch {
      toast.error('خطا در بارگذاری بازی‌ها');
      setGames([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeFilter]);

  useEffect(() => { loadGames(); }, [loadGames]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await gamesApi.delete(deleteId);
      toast.success('بازی حذف شد');
      loadGames();
    } catch {
      toast.error('خطا در حذف بازی');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    // به‌روزرسانی خوش‌بینانه
    setGames(prev => prev.map(g => g.id === id ? { ...g, isActive: !g.isActive } : g));
    try {
      await gamesApi.toggleActive(id);
      toast.success('وضعیت بازی تغییر کرد');
    } catch {
      toast.error('خطا');
      loadGames();
    }
  };

  const handleToggleFeatured = async (id: string) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, isFeatured: !g.isFeatured } : g));
    try {
      await gamesApi.toggleFeatured(id);
      toast.success('وضعیت ویژه تغییر کرد');
    } catch {
      toast.error('خطا');
      loadGames();
    }
  };

  // فیلتر جستجو در سمت کلاینت روی صفحه‌ی جاری
  const filtered = games.filter(g =>
    !search ||
    g.title?.includes(search) ||
    g.category?.name?.includes(search) ||
    g.branch?.name?.includes(search)
  );

  const activeCount = games.filter(g => g.isActive).length;
  const featuredCount = games.filter(g => g.isFeatured).length;
  const totalBookings = games.reduce((s, g) => s + (g.totalBookings || 0), 0);

  const stats = [
    { label: 'کل بازی‌ها', value: persianNum(total), icon: <Gamepad2 className="w-5 h-5" />, color: 'red' as const },
    { label: 'فعال (این صفحه)', value: persianNum(activeCount), icon: <ToggleLeft className="w-5 h-5" />, color: 'green' as const },
    { label: 'ویژه (این صفحه)', value: persianNum(featuredCount), icon: <Bookmark className="w-5 h-5" />, color: 'yellow' as const },
    { label: 'رزروها (این صفحه)', value: persianNum(totalBookings), icon: <BookOpen className="w-5 h-5" />, color: 'blue' as const },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت بازی‌ها"
        subtitle="لیست، ایجاد و ویرایش تمام بازی‌های پلتفرم"
        breadcrumb={[{ label: 'داشبورد', href: '/dashboard' }, { label: 'بازی‌ها' }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={loadGames} className="btn-secondary" title="بارگذاری مجدد">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/games/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              بازی جدید
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => { setSearch(''); setActiveFilter(''); setPage(1); }}>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="جستجو در بازی‌ها..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pr-10"
          />
        </div>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }} className="select-field w-36">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </select>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-slate-700 overflow-hidden mr-auto">
          <button onClick={() => setView('table')} className={`p-2.5 transition-all ${view === 'table' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setView('grid')} className={`p-2.5 transition-all ${view === 'grid' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </FilterBar>

      {loading ? (
        <div className="admin-card text-center py-16 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
          در حال بارگذاری...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="بازی‌ای یافت نشد"
          description="هنوز بازی‌ای ثبت نشده یا با فیلتر فعلی مطابقت ندارد."
        />
      ) : view === 'table' ? (
        <div className="admin-card">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>بازی</th>
                  <th>دسته / شعبه</th>
                  <th>قیمت</th>
                  <th>سطح</th>
                  <th>ترس</th>
                  <th>بازیکنان</th>
                  <th>امتیاز</th>
                  <th>رزروها</th>
                  <th>وضعیت</th>
                  <th>ویژه</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(game => (
                  <tr key={game.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                          {game.coverImage ? (
                            <img src={game.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Gamepad2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{game.title}</p>
                          <p className="text-slate-500 text-xs">{persianNum(game.duration || 0)} دقیقه</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-slate-300">{game.category?.name}</p>
                      <p className="text-slate-500 text-xs">{game.branch?.name}</p>
                    </td>
                    <td className="text-white font-medium">{formatToman(game.pricePerPerson)}</td>
                    <td>
                      {game.tier && (
                        <span className={`badge text-xs ${GAME_TIER_STYLE[game.tier]}`}>
                          {GAME_TIER_FA[game.tier]}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{FEAR_EMOJIS[(game.fearLevel || 1) - 1]}</span>
                        <span className="text-slate-400 text-xs">{fearLabel(game.fearLevel || 1)}</span>
                      </div>
                    </td>
                    <td className="text-slate-300">{persianNum(game.minPlayers || 0)}-{persianNum(game.maxPlayers || 0)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white">{game.rating ?? '—'}</span>
                      </div>
                    </td>
                    <td className="text-slate-300">{persianNum(game.totalBookings || 0)}</td>
                    <td>
                      <Toggle checked={game.isActive} onChange={() => handleToggleActive(game.id)} />
                    </td>
                    <td>
                      <Toggle checked={game.isFeatured} onChange={() => handleToggleFeatured(game.id)} />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link href={`/games/${game.id}`} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link href={`/games/${game.id}/stats`} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setDeleteId(game.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(game => (
            <div key={game.id} className="admin-card hover:border-slate-600 transition-all group">
              <div className="aspect-video bg-slate-700 rounded-xl mb-3 overflow-hidden relative">
                {game.coverImage ? (
                  <img src={game.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Gamepad2 className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <Link href={`/games/${game.id}`} className="btn-secondary text-xs py-1.5 px-3">
                    <Edit className="w-3 h-3" /> ویرایش
                  </Link>
                  <button onClick={() => setDeleteId(game.id)} className="btn-danger text-xs py-1.5 px-3">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <span className="absolute top-2 right-2 text-2xl">{FEAR_EMOJIS[(game.fearLevel || 1) - 1]}</span>
                {game.isFeatured && (
                  <span className="absolute top-2 left-2 badge bg-yellow-500/80 text-yellow-100 text-xs">ویژه</span>
                )}
                {game.tier && (
                  <span className={`absolute bottom-2 left-2 badge text-xs ${GAME_TIER_STYLE[game.tier]}`}>
                    {GAME_TIER_FA[game.tier]}
                  </span>
                )}
              </div>
              <h3 className="text-white font-bold mb-1">{game.title}</h3>
              <p className="text-slate-400 text-xs mb-3">{game.category?.name} — {game.branch?.name}</p>
              <div className="flex items-center justify-between">
                <p className="text-red-400 font-bold text-sm">{formatToman(game.pricePerPerson)}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-white text-sm">{game.rating ?? '—'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <Toggle checked={game.isActive} onChange={() => handleToggleActive(game.id)} label="فعال" />
                <span className="text-slate-500 text-xs">{persianNum(game.totalBookings || 0)} رزرو</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && total > limit && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف بازی"
        description="آیا از حذف این بازی اطمینان دارید؟ تمام اطلاعات و رزروهای مرتبط نیز تأثیر می‌گیرند."
        confirmLabel="حذف کن"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
