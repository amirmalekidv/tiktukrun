import { SectionHeader } from '@/components/ui';
import GameForm from '@/components/games/GameForm';

export default function NewGamePage() {
  return (
    <div className="fade-in">
      <SectionHeader
        title="ایجاد بازی جدید"
        subtitle="اطلاعات کامل بازی را وارد کنید"
        breadcrumb={[{ label: 'بازی‌ها', href: '/games' }, { label: 'بازی جدید' }]}
      />
      <div className="max-w-3xl">
        <GameForm />
      </div>
    </div>
  );
}
