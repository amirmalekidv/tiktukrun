'use client';
import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { SectionHeader, ConfirmDialog } from '@/components/ui';
import { gamesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, Trash2, GripVertical, Plus } from 'lucide-react';

const MOCK_IMAGES = [
  'https://picsum.photos/400/300?random=1',
  'https://picsum.photos/400/300?random=2',
  'https://picsum.photos/400/300?random=3',
  'https://picsum.photos/400/300?random=4',
];

export default function GameImagesPage() {
  const params = useParams();
  const id = params.id as string;
  const [images, setImages] = useState(MOCK_IMAGES);
  const [deleteImg, setDeleteImg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        await gamesApi.uploadImage(id, file);
        setImages(prev => [...prev, URL.createObjectURL(file)]);
      }
      toast.success(`${files.length} تصویر آپلود شد`);
    } catch {
      toast.error('خطا در آپلود');
    } finally {
      setUploading(false);
    }
  }, [id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop,
  });

  const handleDelete = async () => {
    if (!deleteImg) return;
    try {
      await gamesApi.deleteImage(id, deleteImg);
      setImages(prev => prev.filter(img => img !== deleteImg));
      toast.success('تصویر حذف شد');
    } catch {
      toast.error('خطا در حذف');
    } finally {
      setDeleteImg(null);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="گالری تصاویر"
        subtitle="مدیریت تصاویر این بازی"
        breadcrumb={[
          { label: 'بازی‌ها', href: '/games' },
          { label: 'ویرایش', href: `/games/${id}` },
          { label: 'تصاویر' },
        ]}
      />

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`admin-card border-2 border-dashed cursor-pointer mb-6 transition-all text-center py-10 ${
          isDragActive ? 'border-red-500 bg-red-500/5' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-red-400' : 'text-slate-600'}`} />
        <p className="text-slate-400">
          {uploading ? 'در حال آپلود...' : 'تصاویر را اینجا بکشید یا کلیک کنید'}
        </p>
        <p className="text-slate-600 text-sm mt-1">PNG, JPG, WebP — حداکثر ۵MB هر فایل</p>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((img, i) => (
          <div key={img} className="group relative aspect-video rounded-xl overflow-hidden bg-slate-800">
            <img src={img} alt={`تصویر ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
              <button className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-white cursor-grab">
                <GripVertical className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteImg(img)}
                className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
              #{i + 1}
            </div>
          </div>
        ))}

        {/* Add More */}
        <div
          {...getRootProps()}
          className="aspect-video rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-600 flex items-center justify-center cursor-pointer group"
        >
          <input {...getInputProps()} />
          <Plus className="w-8 h-8 text-slate-600 group-hover:text-slate-400" />
        </div>
      </div>

      <p className="text-slate-500 text-sm mt-4">
        برای تغییر ترتیب، تصاویر را بکشید و جابجا کنید. {persianNum(images.length)} تصویر بارگذاری شده.
      </p>

      <ConfirmDialog
        open={!!deleteImg}
        onClose={() => setDeleteImg(null)}
        onConfirm={handleDelete}
        title="حذف تصویر"
        description="آیا از حذف این تصویر اطمینان دارید؟"
        confirmLabel="حذف کن"
        variant="danger"
      />
    </div>
  );
}

function persianNum(n: number) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}
