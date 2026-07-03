'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Toggle } from '@/components/ui';
import { gamesApi, categoriesApi, branchesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, Plus } from 'lucide-react';
import type { Game, Category, Branch } from '@/lib/types';
import { FEAR_EMOJIS, fearLabel } from '@/lib/utils/format';

function unwrapList<T>(res: { data?: { data?: T } | T }): T {
  const body = res.data as { data?: T } | T;
  return (body && typeof body === 'object' && 'data' in body ? body.data : body) as T;
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { error?: { message?: string }; message?: string | string[] };
    const msg = body?.error?.message ?? body?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && msg[0]) return msg[0];
  }
  return fallback;
}

const schema = z.object({
  title: z.string().min(2, 'عنوان حداقل ۲ کاراکتر باشد'),
  subtitle: z.string().optional(),
  slug: z.string().min(2).optional(),
  categoryId: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  branchId: z.string().min(1, 'شعبه را انتخاب کنید'),
  description: z.string().optional(),
  scenario: z.string().optional(),
  fearLevel: z.number().min(1).max(5),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
  tier: z.enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']),
  minPlayers: z.number().min(1),
  maxPlayers: z.number().min(1),
  duration: z.number().min(15),
  pricePerPerson: z.string().min(1, 'قیمت را وارد کنید'),
  weeklyDiscountPercent: z.number().min(0).max(100).optional(),
  siteRank: z.number().optional(),
  tags: z.array(z.string()),
  teaserUrl: z.string().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface GameFormProps {
  game?: Game;
  onSuccess?: () => void;
}

function mergeById<T extends { id: string }>(items: T[], extra?: T | null): T[] {
  if (!extra?.id) return items;
  return items.some((item) => item.id === extra.id) ? items : [extra, ...items];
}

function buildDefaultValues(game?: Game): FormData {
  return {
    title: game?.title || '',
    subtitle: game?.subtitle || '',
    slug: game?.slug || '',
    categoryId: game?.categoryId || '',
    branchId: game?.branchId || '',
    description: game?.description || '',
    scenario: game?.scenario || '',
    fearLevel: game?.fearLevel || 3,
    difficulty: game?.difficulty || 'MEDIUM',
    tier: (game as any)?.tier || 'STANDARD',
    minPlayers: game?.minPlayers || 2,
    maxPlayers: game?.maxPlayers || 6,
    duration: game?.duration || 60,
    pricePerPerson: game?.pricePerPerson || '',
    weeklyDiscountPercent: game?.weeklyDiscountPercent || 0,
    siteRank: game?.siteRank != null ? Number(game.siteRank) : undefined,
    tags: game?.tags || [],
    teaserUrl: game?.teaserUrl || '',
    isActive: game?.isActive ?? true,
    isFeatured: game?.isFeatured ?? false,
  };
}

export default function GameForm({ game, onSuccess }: GameFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(game?.coverImage || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [catRes, branchRes] = await Promise.all([
          categoriesApi.getAll(),
          branchesApi.getAll(),
        ]);
        setCategories(mergeById(unwrapList<Category[]>(catRes) ?? [], game?.category));
        setBranches(mergeById(unwrapList<Branch[]>(branchRes) ?? [], game?.branch));
      } catch {
        setCategories(game?.category ? [game.category] : []);
        setBranches(game?.branch ? [game.branch] : []);
        toast.error('خطا در بارگذاری دسته‌بندی‌ها و شعب');
      } finally {
        setOptionsLoading(false);
      }
    })();
  }, [game?.branch?.id, game?.category?.id]);

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(game),
  });

  useEffect(() => {
    reset(buildDefaultValues(game));
    setCoverPreview(game?.coverImage || null);
    setCoverFile(null);
  }, [game, reset]);

  const fearLevel = watch('fearLevel');
  const tags = watch('tags');
  const isActive = watch('isActive');
  const isFeatured = watch('isFeatured');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (files) => {
      const file = files[0];
      if (file) {
        setCoverPreview((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
        setCoverFile(file);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setValue('tags', [...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter(t => t !== tag));
  };

  const generateSlug = (title: string) => {
    setValue('slug', title
      .toLowerCase()
      .replace(/[\u0600-\u06FF]/g, (c) => c) // keep Persian
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    );
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', data.title);
      if (data.subtitle) fd.append('subtitle', data.subtitle);
      if (data.slug) fd.append('slug', data.slug);
      fd.append('categoryId', data.categoryId);
      fd.append('branchId', data.branchId);
      if (data.description) fd.append('description', data.description);
      if (data.scenario) fd.append('scenario', data.scenario);
      fd.append('fearLevel', String(data.fearLevel));
      fd.append('difficulty', data.difficulty);
      fd.append('tier', data.tier);
      fd.append('minPlayers', String(data.minPlayers));
      fd.append('maxPlayers', String(data.maxPlayers));
      fd.append('durationMinutes', String(data.duration));
      fd.append('pricePerPerson', data.pricePerPerson);
      if (data.weeklyDiscountPercent !== undefined) {
        fd.append('weeklyDiscountPercent', String(data.weeklyDiscountPercent));
      }
      if (data.siteRank !== undefined && !Number.isNaN(data.siteRank)) {
        fd.append('siteRank', String(data.siteRank));
      }
      if (data.tags.length > 0) fd.append('tags', JSON.stringify(data.tags));
      fd.append('isActive', String(data.isActive));
      fd.append('isFeatured', String(data.isFeatured));
      if (data.teaserUrl) fd.append('teaserUrl', data.teaserUrl);
      if (coverFile) fd.append('cover', coverFile);

      if (game) {
        await gamesApi.update(game.id, fd);
        toast.success('بازی با موفقیت بروزرسانی شد');
      } else {
        await gamesApi.create(fd);
        toast.success('بازی با موفقیت ایجاد شد');
      }
      onSuccess?.();
      router.push('/games');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'خطا در ذخیره بازی'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="admin-card">
        <h3 className="section-title">اطلاعات پایه</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label-field">عنوان بازی *</label>
            <input
              {...register('title')}
              className="input-field"
              placeholder="مثال: اتاق فرار تاریک"
              onChange={e => { register('title').onChange(e); generateSlug(e.target.value); }}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label-field">زیرعنوان</label>
            <input {...register('subtitle')} className="input-field" placeholder="توضیح کوتاه..." />
          </div>

          <div>
            <label className="label-field">slug (URL)</label>
            <input {...register('slug')} className="input-field" dir="ltr" placeholder="dark-room" />
          </div>

          <div>
            <label className="label-field">دسته‌بندی *</label>
            <select {...register('categoryId')} className="select-field" disabled={optionsLoading}>
              <option value="">{optionsLoading ? 'در حال بارگذاری...' : 'انتخاب...'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className="label-field">شعبه *</label>
            <select {...register('branchId')} className="select-field" disabled={optionsLoading}>
              <option value="">{optionsLoading ? 'در حال بارگذاری...' : 'انتخاب...'}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            {errors.branchId && <p className="text-red-400 text-xs mt-1">{errors.branchId.message}</p>}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="admin-card">
        <h3 className="section-title">توضیحات</h3>
        <div className="space-y-4">
          <div>
            <label className="label-field">توضیحات کامل</label>
            <textarea {...register('description')} className="input-field h-32 resize-none" placeholder="توضیح کامل بازی برای کاربران..." />
          </div>
          <div>
            <label className="label-field">سناریو</label>
            <textarea {...register('scenario')} className="input-field h-24 resize-none" placeholder="داستان و سناریو بازی..." />
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="admin-card">
        <h3 className="section-title">خصوصیات</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Fear Level */}
          <div className="md:col-span-3">
            <label className="label-field">سطح ترس: {FEAR_EMOJIS[fearLevel - 1]} {fearLabel(fearLevel)}</label>
            <Controller
              control={control}
              name="fearLevel"
              render={({ field }) => (
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={field.value}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                    className="flex-1 accent-red-600"
                  />
                  <div className="flex gap-1">
                    {FEAR_EMOJIS.map((em, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => field.onChange(i + 1)}
                        className={`text-2xl transition-all ${i < field.value ? 'opacity-100' : 'opacity-30'}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            />
          </div>

          <div>
            <label className="label-field">سختی</label>
            <select {...register('difficulty')} className="select-field">
              <option value="EASY">آسان</option>
              <option value="MEDIUM">متوسط</option>
              <option value="HARD">سخت</option>
              <option value="EXPERT">خبره</option>
            </select>
          </div>

          <div>
            <label className="label-field">سطح‌بندی (Tier)</label>
            <select {...register('tier')} className="select-field">
              <option value="STANDARD">استاندارد</option>
              <option value="SILVER">نقره‌ای</option>
              <option value="GOLD">طلایی</option>
              <option value="PLATINUM">پلاتینیوم</option>
              <option value="DIAMOND">دایموند</option>
            </select>
          </div>

          <div>
            <label className="label-field">حداقل بازیکن</label>
            <input type="number" {...register('minPlayers', { valueAsNumber: true })} className="input-field" min={1} />
          </div>

          <div>
            <label className="label-field">حداکثر بازیکن</label>
            <input type="number" {...register('maxPlayers', { valueAsNumber: true })} className="input-field" min={1} />
          </div>

          <div>
            <label className="label-field">مدت بازی (دقیقه)</label>
            <input type="number" {...register('duration', { valueAsNumber: true })} className="input-field" min={15} />
          </div>

          <div>
            <label className="label-field">رتبه سایت</label>
            <input type="number" {...register('siteRank', { valueAsNumber: true })} className="input-field" min={1} />
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="admin-card">
        <h3 className="section-title">قیمت‌گذاری</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">قیمت هر نفر (تومان) *</label>
            <input {...register('pricePerPerson')} className="input-field" placeholder="250000" />
            {errors.pricePerPerson && <p className="text-red-400 text-xs mt-1">{errors.pricePerPerson.message}</p>}
          </div>
          <div>
            <label className="label-field">تخفیف هفتگی (%)</label>
            <input type="number" {...register('weeklyDiscountPercent', { valueAsNumber: true })} className="input-field" min={0} max={100} />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="admin-card">
        <h3 className="section-title">تگ‌ها</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map(tag => (
            <span key={tag} className="badge bg-red-500/20 text-red-400 border border-red-500/30 gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className="input-field flex-1"
            placeholder="تگ جدید... (Enter)"
          />
          <button type="button" onClick={addTag} className="btn-secondary">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="admin-card">
        <h3 className="section-title">تصویر کاور</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-red-500 bg-red-500/5' : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          <input {...getInputProps()} />
          {coverPreview ? (
            <div className="relative inline-block">
              <img src={coverPreview} alt="Cover" className="max-h-48 rounded-xl mx-auto" />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setCoverPreview(null); setCoverFile(null); }}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">فایل را اینجا بکشید یا کلیک کنید</p>
              <p className="text-slate-600 text-sm mt-1">PNG, JPG, WebP حداکثر ۵MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Teaser */}
      <div className="admin-card">
        <h3 className="section-title">تیزر ویدیو (اختیاری)</h3>
        <input
          {...register('teaserUrl')}
          className="input-field"
          dir="ltr"
          placeholder="https://youtube.com/... یا URL فایل ویدیو"
        />
      </div>

      {/* Status */}
      <div className="admin-card">
        <h3 className="section-title">وضعیت انتشار</h3>
        <div className="flex flex-col gap-4">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Toggle
                checked={field.value}
                onChange={field.onChange}
                label="فعال (نمایش در سایت)"
              />
            )}
          />
          <Controller
            control={control}
            name="isFeatured"
            render={({ field }) => (
              <Toggle
                checked={field.value}
                onChange={field.onChange}
                label="ویژه (نمایش در صفحه اول)"
              />
            )}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {game ? 'ذخیره تغییرات' : 'ایجاد بازی'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          انصراف
        </button>
      </div>
    </form>
  );
}
