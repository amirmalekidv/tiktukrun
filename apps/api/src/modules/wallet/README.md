# Wallet Module

مدیریت کیف پول با 4 ارز: تومان، سکه، الماس، XP.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/wallet/me | Auth | موجودی |
| GET | /api/v1/wallet/me/transactions | Auth | تراکنش‌ها |
| GET | /api/v1/wallet/packages/diamonds | Public | بسته‌های الماس |
| GET | /api/v1/wallet/packages/coins | Public | بسته‌های سکه |
| POST | /api/v1/wallet/charge | Auth | شارژ (ZarinPal) |
| POST | /api/v1/wallet/purchase-diamonds | Auth | خرید الماس |
| POST | /api/v1/wallet/purchase-coins | Auth | خرید سکه |
| POST | /api/v1/wallet/convert | Auth | تبدیل XP→سکه |
| GET | /api/v1/admin/wallets/transactions | Admin | همه تراکنش‌ها |
| POST | /api/v1/admin/wallets/manual-adjust | Admin | تنظیم دستی |

## Diamond Packages
- pkg_50: 50 الماس = ۵۰,۰۰۰ تومان
- pkg_200: 200 الماس = ۱۸۰,۰۰۰ تومان
- pkg_500: 500 الماس = ۴۰۰,۰۰۰ تومان
- pkg_1500: 1500 الماس = ۱,۰۰۰,۰۰۰ تومان
