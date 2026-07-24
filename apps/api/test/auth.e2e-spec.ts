import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;
  const testMobile = '09111111111';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test user
    await prisma.user.deleteMany({ where: { mobile: testMobile } });
    await app.close();
  });

  // ─── OTP Request Tests ───────────────────────────────────────────────────

  it('POST /api/v1/auth/otp/request — should send OTP successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ mobile: testMobile })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.expiresInSeconds).toBe(1200);
  });

  it('POST /api/v1/auth/otp/request — should reject invalid mobile', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ mobile: '0812345678' })
      .expect(400);
  });

  it('POST /api/v1/auth/otp/request — should reject empty mobile', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({})
      .expect(400);
  });

  it('POST /api/v1/auth/otp/request — should normalize Persian digits', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ mobile: '۰۹۱۱۱۱۱۱۱۱۱' })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  // ─── OTP Verify Tests ────────────────────────────────────────────────────

  it('POST /api/v1/auth/otp/verify — should fail with wrong code', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ mobile: testMobile, code: '000000' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/otp/verify — should fail with invalid code format', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ mobile: testMobile, code: 'abc' })
      .expect(400);
  });

  // ─── Auth Me Tests ───────────────────────────────────────────────────────

  it('GET /api/v1/auth/me — should fail without token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('GET /api/v1/auth/me — should fail with invalid token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);
  });

  // ─── Refresh Token Tests ─────────────────────────────────────────────────

  it('POST /api/v1/auth/refresh — should fail with empty body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({})
      .expect(400);
  });

  it('POST /api/v1/auth/refresh — should fail with invalid refresh token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid_refresh_token' })
      .expect(401);
  });

  // ─── Logout Tests ────────────────────────────────────────────────────────

  it('POST /api/v1/auth/logout — should fail without auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .expect(401);
  });

  // ─── Admin Login Tests ───────────────────────────────────────────────────

  it('POST /api/v1/auth/admin/login — should fail with wrong credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({ mobile: '09100000000', password: 'WrongPassword' })
      .expect(401);
  });

  it('POST /api/v1/auth/admin/login — should validate password length', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({ mobile: '09100000000', password: 'short' })
      .expect(400);
  });
});
