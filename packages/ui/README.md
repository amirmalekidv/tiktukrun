# @tiktakrun/ui — کتابخانه کامپوننت‌های UI

کامپوننت‌های مشترک با تم **Shadow Realm** (گاتیک قرمز/مشکی) برای TIK TAK RUN.

---

## کامپوننت‌ها

### Button
```tsx
import { Button } from '@tiktakrun/ui';

// Variants: blood | ghost | outline | success | danger | accent
<Button variant="blood" size="lg" loading={false}>رزرو کن</Button>
<Button variant="outline" leftIcon={<i className="fas fa-plus" />}>افزودن</Button>
<Button variant="accent">برنده شدی! 🏆</Button>
```

### Modal
```tsx
import { Modal } from '@tiktakrun/ui';

<Modal isOpen={open} onClose={() => setOpen(false)} title="تأیید رزرو" size="md"
  footer={<><Button variant="ghost" onClick={close}>انصراف</Button><Button>تأیید</Button></>}
>
  <p>آیا از رزرو مطمئنید؟</p>
</Modal>
```

### Card
```tsx
import { Card } from '@tiktakrun/ui';

// Variants: dark-card | glass-card | flat
<Card variant="dark-card" hover padding="md">محتوا</Card>
<Card variant="glass-card">محتوا</Card>
```

### Badge
```tsx
import { Badge } from '@tiktakrun/ui';

// Variants: blood | success | warning | info | ghost | accent | muted
<Badge variant="blood" dot>در حال اجرا</Badge>
<Badge variant="accent">الماس 💎</Badge>
<Badge variant="success">پرداخت‌شده</Badge>
```

### FormElements
```tsx
import { Input, Select, Textarea, Checkbox, Switch } from '@tiktakrun/ui';

<Input label="شماره موبایل" placeholder="09..." error="فرمت اشتباه" fullWidth />
<Select label="بازی" options={[{value:'escape', label:'اتاق فرار'}]} fullWidth />
<Textarea label="توضیحات" rows={4} fullWidth />
<Checkbox label="با قوانین موافقم" checked={agreed} onChange={setAgreed} />
<Switch checked={enabled} onChange={setEnabled} label="فعال" />
```

### Avatar
```tsx
import { Avatar } from '@tiktakrun/ui';

<Avatar src="/photo.jpg" name="علی محمدی" size="lg" online />
<Avatar name="علی" size="md" /> {/* initials fallback */}
```

### Spinner, ProgressBar, Skeleton
```tsx
import { Spinner, ProgressBar, Skeleton } from '@tiktakrun/ui';

<Spinner size="lg" color="primary" label="در حال بارگذاری..." />
<ProgressBar value={75} label="امتیاز" showValue color="accent" animate />
<Skeleton lines={3} height="1rem" />
<Skeleton width="80px" height="80px" rounded="full" />
```

### Tooltip و HelpIcon
```tsx
import { Tooltip, HelpIcon } from '@tiktakrun/ui';

<Tooltip content="این فیلد اجباری است" position="top">
  <span>?</span>
</Tooltip>

{/* دقیقاً مثل demo2 EscapeVerse */}
<HelpIcon tooltip="مجموع امتیازهای کسب‌شده در همه بازی‌ها" position="top" />
```

---

## Tailwind Theme (Shadow Realm)

```ts
// از packages/config/tailwind-config/base.ts
colors: {
  background: '#0a0000',
  primary: '#dc2626',
  'primary-dark': '#7f1d1d',
  accent: '#fbbf24',
  ...
}
fonts: {
  sans: ['Vazirmatn', ...],
  display: ['Estedad', ...],
  cinzel: ['Cinzel', ...],
  creepster: ['Creepster', ...],
}
```
