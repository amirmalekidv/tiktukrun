'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { SectionHeader, ConfirmDialog, EmptyState } from '@/components/ui';
import { gamesApi } from '@/lib/api';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import { Upload, Trash2, Plus, RefreshCw } from 'lucide-react';

interface GameImage {
  id: string;
  url: string;
  displayOrder: number;
  caption?: string;
}

// admin/games/:id is single-wrapped: { success, data: game }
function readData<T>(res: any): T {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data as T;
  return body as T;
}

export default function GameImagesPage() {
  const params = useParams();
  const id = params.id as string;
  const [images, setImages] = useState<GameImage[]>([]);
  const [gameTitle, setGameTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteImg, setDeleteImg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await gamesApi.getById(id);
      const game = readData<any>(res);
      setImages(Array.isArray(game?.images) ? game.images : []);
      setGameTitle(game?.title || '');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در دریافت تصاویر بازی');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);
      try {
        await gamesApi.uploadImage(id, files);
        toast.success(`${persianNum(files.length)} تصویر آپلود شد`);
        await load();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'خطا در آپلود تصویر');
      } finally {
        setUploading(false);
      }
    },
    [id, load],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop,
    disabled: uploading,
  });

  const handleDelete = async () => {
    if (!deleteImg) return;
    setDeleting(true);
    try {
      await gamesApi.deleteImage(id, deleteImg);
      setImages((prev) => prev.filter((img) => img.id !== deleteImg));
      toast.success('تصویر حذف شد');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در حذف تصویر');
    } finally {
      setDeleting(false);
      setDeleteImg(null);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="گالری تصاویر"
        subtitle={gameTitle ? `مدیریت تصاویر «${gameTitle}»` : 'مدیریت تصاویر این بازی'}
        breadcrumb={[
          { label: 'بازی‌ها', href: '/games' },
          { label: 'ویرایش', href: `/games/${id}` },
          { label: 'تصاویر' },
        ]}
      />

      <div
        {...getRootProps()}
        className={`admin-card border-2 border-dashed cursor-pointer mb-6 transition-all text-center py-10 ${
          isDragActive ? 'border-red-500 bg-red-500/5' : 'border-slate-700 hover:border-slate-600'
        } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-red-400' : 'text-slate-600'}`} />
        <p className="text-slate-400">
          {uploading ? 'در حال آپلود...' : 'تصاویر را اینجا بکشید یا کلیک کنید'}
        </p>
        <p className="text-slate-600 text-sm mt-1">PNG, JPG, WebP — حداکثر ۱۰ تصویر برای هر بازی</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <EmptyState title="تصویری ثبت نشده" description="برای این بازی هنوز تصویری بارگذاری نشده است." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((img, i) => (
              <div key={img.id} className="group relative aspect-video rounded-xl overflow-hidden bg-slate-800">
                <img src={img.url} alt={img.caption || `تصویر ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={() => setDeleteImg(img.id)}
                    className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700"
                    title="حذف تصویر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  #{persianNum(i + 1)}
                </div>
              </div>
            ))}

            {images.length < 10 && (
              <div
                {...getRootProps()}
                className="aspect-video rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-600 flex items-center justify-center cursor-pointer group"
              >
                <input {...getInputProps()} />
                <Plus className="w-8 h-8 text-slate-600 group-hover:text-slate-400" />
              </div>
            )}
          </div>

          <p className="text-slate-500 text-sm mt-4">{persianNum(images.length)} تصویر بارگذاری شده.</p>
        </>
      )}

      <ConfirmDialog
        open={!!deleteImg}
        onClose={() => setDeleteImg(null)}
        onConfirm={handleDelete}
        title="حذف تصویر"
        description="آیا از حذف این تصویر اطمینان دارید؟"
        confirmLabel="حذف کن"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
