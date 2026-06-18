import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
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

  // User endpoints
  it('GET /api/v1/users/me — should require auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('PATCH /api/v1/users/me — should require auth', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .send({ fullName: 'تست' })
      .expect(401);
  });

  it('GET /api/v1/users/me/avatar/items — should require auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me/avatar/items').expect(401);
  });

  it('POST /api/v1/users/me/avatar/purchase — should require auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users/me/avatar/purchase')
      .send({ itemId: 'some-item' })
      .expect(401);
  });

  it('PATCH /api/v1/users/me/avatar/config — should require auth', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users/me/avatar/config')
      .send({ hatId: 'hat-1' })
      .expect(401);
  });

  // Profile endpoints
  it('GET /api/v1/profile/me/stats — should require auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/profile/me/stats').expect(401);
  });

  it('GET /api/v1/profile/me/badges — should require auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/profile/me/badges').expect(401);
  });

  it('GET /api/v1/profile/leaderboard — should be accessible (returns empty or data)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/profile/leaderboard')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/profile/:userId/public — should return 404 for non-existent user', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/profile/nonexistent-user-id/public')
      .expect(404);
  });

  // Invites endpoints
  it('POST /api/v1/invites/validate — should validate invite code publicly', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/invites/validate')
      .send({ code: 'NONEXISTENT' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(false);
  });

  it('GET /api/v1/invites/me — should require auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/invites/me').expect(401);
  });

  it('POST /api/v1/invites/apply — should require auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/invites/apply')
      .send({ code: 'ABC12345' })
      .expect(401);
  });

  // Notifications
  it('GET /api/v1/notifications/me — should require auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/notifications/me').expect(401);
  });

  it('GET /api/v1/notifications/me/unread-count — should require auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/notifications/me/unread-count')
      .expect(401);
  });

  // Admin endpoints
  it('GET /api/v1/admin/users — should require auth and admin role', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/users').expect(401);
  });

  it('GET /api/v1/admin/users/:id — should require auth and admin role', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/users/some-id')
      .expect(401);
  });
});
