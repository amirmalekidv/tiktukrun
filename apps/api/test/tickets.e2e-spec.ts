import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tickets Module (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let createdTicketId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    userToken = process.env.TEST_JWT_TOKEN ?? 'user-token';
    adminToken = process.env.ADMIN_JWT_TOKEN ?? 'admin-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Ticket Flow', () => {
    it('POST /api/v1/tickets should create ticket', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          subject: 'مشکل در رزرو',
          body: 'سلام، نمی‌توانم رزرو انجام دهم',
          priority: 'HIGH',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toMatch(/^TKT-\d{6}$/);
      createdTicketId = res.body.data.id;
    });

    it('GET /api/v1/tickets/me should list user tickets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tickets/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/v1/tickets/me/:id/reply should add reply', async () => {
      if (!createdTicketId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/tickets/me/${createdTicketId}/reply`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'اطلاعات بیشتر ارسال می‌کنم' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Admin Ticket Flow', () => {
    it('GET /api/v1/admin/tickets should return all tickets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/admin/tickets/stats should return stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/tickets/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('open');
      expect(res.body.data).toHaveProperty('inProgress');
      expect(res.body.data).toHaveProperty('closedToday');
    });

    it('PATCH /api/v1/admin/tickets/:id should update status', async () => {
      if (!createdTicketId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_PROGRESS', priority: 'HIGH' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
