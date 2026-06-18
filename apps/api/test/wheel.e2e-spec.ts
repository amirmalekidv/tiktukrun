import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Wheel Module (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Obtain JWT token (assumes auth endpoints from Phase 3)
    // In real tests, mock the auth or use a test user
    authToken = process.env.TEST_JWT_TOKEN ?? 'test-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/wheel/prizes', () => {
    it('should return active wheel prizes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/wheel/prizes')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/wheel/me/eligibility', () => {
    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/wheel/me/eligibility')
        .expect(401);
    });

    it('should return eligibility with valid auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/wheel/me/eligibility')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('canSpinWithXp');
      expect(res.body.data).toHaveProperty('coinsCost');
      expect(res.body.data).toHaveProperty('diamondsCost');
    });
  });

  describe('POST /api/v1/wheel/spin', () => {
    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/wheel/spin')
        .send({ paidWith: 'COINS' })
        .expect(401);
    });

    it('should reject invalid paidWith', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/wheel/spin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paidWith: 'INVALID' })
        .expect(400);
    });
  });

  describe('Admin Wheel', () => {
    it('GET /api/v1/admin/wheel/prizes should return all prizes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/wheel/prizes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/admin/wheel/stats should return stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/wheel/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('totalSpins');
      expect(res.body.data).toHaveProperty('totalCoinsSpent');
    });

    it('POST /api/v1/admin/wheel/prizes should create a new prize', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/wheel/prizes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'سکه طلایی',
          icon: '🪙',
          type: 'COINS',
          value: 500,
          weight: 10,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('سکه طلایی');
    });
  });
});
