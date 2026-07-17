'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionHeader, Toggle, EmptyState } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { landingSectionsApi, categoriesApi, citiesApi, gamesApi } from '@/lib/api';
import type { LandingSection, LandingSectionFilterType, Category, City, Game } from '@/lib/types';
import toast from 'react-hot-toast';

function unwrap<T = unknown>(res: { data?: unknown }): T {
  const d = res?.data as { data?: T } | T | undefined;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

const FILTER_LABELS: Record<LandingSectionFilterType, string> = {
  WEEKLY_DISCOUNT: 'تخفیف هفتگی (خودکار)',
  FEATURED: 'بازی‌های ویژه (isFeatured)',
  CATEGORY: 'بر اساس دسته‌بندی',
  CATEGORY_CITY: 'دسته + شهر',
  MULTI_CATEGORY: 'چند دسته‌بندی',
  POPULAR_THIS_WEEK: 'پرفروش این هفته',
  MANUAL: 'انتخاب دستی بازی‌ها',
};

const ICON_OPTIONS = [
  'fas fa-bolt',
  'fas fa-heart',
  'fas fa-door-open',
  'fas fa-film',
  'fas fa-ghost',
  'fas fa-puzzle-piece',
  'fas fa-fire',
  'fas fa-dice',
  'fas fa-star',
  'fas fa-gamepad',
];

export default function LandingSectionsPage() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<LandingSection>>>({});
  const [manualGameIds, setManualGameIds] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sectionsRes, categoriesRes, citiesRes, gamesRes] = await Promise.all([
        landingSectionsApi.getAll(),
        categoriesApi.getAll(),
        citiesApi.getAll(),
        gamesApi.getAll({ limit: 200, isActive: true }),
      ]);
      const list = unwrap<LandingSection[]>(sectionsRes) ?? [];
      setSections(list);
      setCategories(unwrap<Category[]>(categoriesRes) ?? []);
      setCities(unwrap<City[]>(citiesRes) ?? []);
      const gamesPayload = unwrap<{ items?: Game[] } | Game[]>(gamesRes);
      setGames(Array.isArray(gamesPayload) ? gamesPayload : gamesPayload?.items ?? []);
      setDrafts({});
      setManualGameIds(
        Object.fromEntries(
          list.map((s) => [s.id, s.manualGames?.map((g) => g.gameId) ?? []]),
        ),
      );
    } catch {
      toast.error('خطا در بارگذاری سکشن‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getDraft = (section: LandingSection): Partial<LandingSection> =>
    drafts[section.id] ?? section;

  const patchDraft = (id: string, patch: Partial<LandingSection>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? sections.find((s) => s.id === id)), ...patch },
    }));
  };

  const handleSave = async (section: LandingSection) => {
    const draft = getDraft(section);
    setSavingId(section.id);
    try {
      await landingSectionsApi.update(section.id, {
        title: draft.title,
        description: draft.description,
        icon: draft.icon,
        displayOrder: draft.displayOrder,
        isActive: draft.isActive,
        filterType: draft.filterType,
        categorySlug: draft.categorySlug || null,
        categorySlugs: draft.categorySlugs ?? [],
        citySlug: draft.citySlug || null,
        tagFilter: draft.tagFilter || null,
      } as Partial<LandingSection>);

      if (draft.filterType === 'MANUAL') {
        await landingSectionsApi.setGames(section.id, manualGameIds[section.id] ?? []);
      }

      toast.success('سکشن ذخیره شد');
      await load();
    } catch {
      toast.error('خطا در ذخیره سکشن');
    } finally {
      setSavingId(null);
    }
  };

  const toggleManualGame = (sectionId: string, gameId: string) => {
    setManualGameIds((prev) => {
      const current = prev[sectionId] ?? [];
      return {
        ...prev,
        [sectionId]: current.includes(gameId)
          ? current.filter((id) => id !== gameId)
          : [...current, gameId],
      };
    });
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="سکشن‌های صفحهٔ اصلی"
        subtitle="مدیریت عنوان، ترتیب نمایش و فیلتر هر سکشن افقی صفحهٔ اول"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'سکشن‌های صفحهٔ اصلی' }]}
        actions={
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">
            <RefreshCw className="w-4 h-4" /> بروزرسانی
          </button>
        }
      />

      <div className="max-w-4xl space-y-4">
        {loading ? (
          <div className="admin-card p-8 text-center text-slate-400">در حال بارگذاری...</div>
        ) : sections.length === 0 ? (
          <EmptyState
            title="سکشنی یافت نشد"
            description="اسکریپت seed را اجرا کنید یا سکشن جدید از API بسازید."
          />
        ) : (
          sections.map((section) => {
            const draft = getDraft(section);
            const expanded = expandedId === section.id;

            return (
              <div key={section.id} className="admin-card overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 text-right hover:bg-slate-800/40 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : section.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm w-6">{persianNum(draft.displayOrder ?? 0)}</span>
                    <i className={`${draft.icon} text-amber-400`} />
                    <div>
                      <div className="text-white font-semibold">{draft.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{section.key} · {FILTER_LABELS[draft.filterType ?? section.filterType]}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${draft.isActive !== false ? 'bg-green-900/40 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                      {draft.isActive !== false ? 'فعال' : 'غیرفعال'}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-700/60 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label-field">عنوان (فارسی)</label>
                        <input
                          className="input-field w-full"
                          value={draft.title ?? ''}
                          onChange={(e) => patchDraft(section.id, { title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label-field">ترتیب نمایش</label>
                        <input
                          type="number"
                          className="input-field w-full"
                          value={draft.displayOrder ?? 0}
                          onChange={(e) => patchDraft(section.id, { displayOrder: Number(e.target.value) })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="label-field">توضیح کوتاه</label>
                        <input
                          className="input-field w-full"
                          value={draft.description ?? ''}
                          onChange={(e) => patchDraft(section.id, { description: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label-field">آیکون</label>
                        <select
                          className="input-field w-full"
                          value={draft.icon ?? 'fas fa-star'}
                          onChange={(e) => patchDraft(section.id, { icon: e.target.value })}
                        >
                          {ICON_OPTIONS.map((icon) => (
                            <option key={icon} value={icon}>{icon}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label-field">نوع فیلتر</label>
                        <select
                          className="input-field w-full"
                          value={draft.filterType ?? section.filterType}
                          onChange={(e) => patchDraft(section.id, { filterType: e.target.value as LandingSectionFilterType })}
                        >
                          {(Object.keys(FILTER_LABELS) as LandingSectionFilterType[]).map((type) => (
                            <option key={type} value={type}>{FILTER_LABELS[type]}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(draft.filterType === 'CATEGORY' || draft.filterType === 'CATEGORY_CITY') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label-field">دسته‌بندی</label>
                          <select
                            className="input-field w-full"
                            value={draft.categorySlug ?? ''}
                            onChange={(e) => patchDraft(section.id, { categorySlug: e.target.value })}
                          >
                            <option value="">انتخاب کنید</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.slug}>{cat.name} ({cat.slug})</option>
                            ))}
                          </select>
                        </div>
                        {draft.filterType === 'CATEGORY' && (
                          <div>
                            <label className="label-field">فیلتر ترس (اختیاری)</label>
                            <select
                              className="input-field w-full"
                              value={draft.tagFilter ?? ''}
                              onChange={(e) => patchDraft(section.id, { tagFilter: e.target.value || undefined })}
                            >
                              <option value="">بدون فیلتر تگ</option>
                              <option value="horror">ترسناک (تگ «ترسناک»)</option>
                              <option value="non-horror">غیرترسناک (بدون تگ «ترسناک»)</option>
                            </select>
                          </div>
                        )}
                        {draft.filterType === 'CATEGORY_CITY' && (
                          <div>
                            <label className="label-field">شهر</label>
                            <select
                              className="input-field w-full"
                              value={draft.citySlug ?? ''}
                              onChange={(e) => patchDraft(section.id, { citySlug: e.target.value })}
                            >
                              <option value="">انتخاب کنید</option>
                              {cities.map((city) => (
                                <option key={city.id} value={city.slug}>{city.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {draft.filterType === 'MULTI_CATEGORY' && (
                      <div>
                        <label className="label-field">دسته‌بندی‌ها</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {categories.map((cat) => {
                            const selected = (draft.categorySlugs ?? []).includes(cat.slug);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  const current = draft.categorySlugs ?? [];
                                  patchDraft(section.id, {
                                    categorySlugs: selected
                                      ? current.filter((s) => s !== cat.slug)
                                      : [...current, cat.slug],
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                  selected
                                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                              >
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {draft.filterType === 'MANUAL' && (
                      <div>
                        <label className="label-field">بازی‌های انتخاب‌شده</label>
                        <div className="max-h-48 overflow-y-auto mt-2 space-y-1 border border-slate-700 rounded-lg p-2">
                          {games.map((game) => {
                            const checked = (manualGameIds[section.id] ?? []).includes(game.id);
                            return (
                              <label key={game.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-800/50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleManualGame(section.id, game.id)}
                                />
                                <span className="text-sm text-slate-200">{game.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Toggle
                        checked={draft.isActive !== false}
                        onChange={(v) => patchDraft(section.id, { isActive: v })}
                        label="نمایش در صفحهٔ اصلی"
                      />
                      <button
                        type="button"
                        disabled={savingId === section.id}
                        onClick={() => handleSave(section)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {savingId === section.id ? 'در حال ذخیره...' : 'ذخیره'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">
                      برای سکشن‌های خودکار، بازی‌ها بر اساس فیلتر (دسته، شهر، تخفیف، featured و ...) نمایش داده می‌شوند.
                      بازی‌ها را از فرم «ویرایش بازی» با دسته‌بندی، شعبه، تگ «ترسناک» و تخفیف هفتگی مدیریت کنید.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
