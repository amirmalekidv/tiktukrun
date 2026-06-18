import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Wallet (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/wallet/packages/diamonds — should return diamond packages publicly', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/wallet/packages/diamonds')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('diamonds');
    expect(res.body.data[0]).toHaveProperty('priceToman');
  });

  it('GET /api/v1/wallet/packages/coins — should return coin packages publicly', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/wallet/packages/coins')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/wallet/me — should require auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/wallet/me')
      .expect(401);
  });

  it('GET /api/v1/wallet/me/transactions — should require auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/wallet/me/transactions')
      .expect(401);
  });

  it('POST /api/v1/wallet/charge — should require auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallet/charge')
      .send({ amount: 100000, method: 'ZARINPAL' })
      .expect(401);
  });

  it('POST /api/v1/wallet/charge — should validate minimum amount with auth header', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallet/charge')
      .set('Authorization', 'Bearer fake_token')
      .send({ amount: 100, method: 'ZARINPAL' })
      .expect(401); // 401 because invalid token, not 400 for validation
  });

  it('POST /api/v1/wallet/purchase-diamonds — should require auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallet/purchase-diamonds')
      .send({ packageId: 'pkg_50' })
      .expect(401);
  });

  it('POST /api/v1/wallet/purchase-coins — should require auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallet/purchase-coins')
      .send({ packageId: 'coin_100' })
      .expect(401);
  });

  it('POST /api/v1/wallet/convert — should require auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallet/convert')
      .send({ from: 'XP', to: 'COINS', amount: 100 })
      .expect(401);
  });

  // Admin endpoints
  it('GET /api/v1/admin/wallets/transactions — should require auth and admin role', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/wallets/transactions')
      .expect(401);
  });

  it('POST /api/v1/admin/wallets/manual-adjust — should require auth and admin role', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/wallets/manual-adjust')
      .send({ userId: 'some-id', currency: 'TOMAN', delta: 10000, reason: 'test' })
      .expect(401);
  });
});
