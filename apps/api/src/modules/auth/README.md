# Auth Module

احراز هویت با OTP موبایل + JWT.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/otp/request | Public | درخواست کد OTP |
| POST | /api/v1/auth/otp/verify | Public | تأیید OTP + ورود/ثبت‌نام |
| POST | /api/v1/auth/refresh | Public | تجدید توکن |
| POST | /api/v1/auth/logout | Auth | خروج |
| GET | /api/v1/auth/me | Auth | اطلاعات کاربر |
| POST | /api/v1/auth/admin/login | Public | ورود ادمین با رمز |

## Features
- OTP 5 digits, TTL 120s
- Rate limit: 3 req/3min per mobile, 3 attempts per OTP
- JWT: Access 15min, Refresh 30day with rotation
- Session management with revocation
- Invite code handling on register
