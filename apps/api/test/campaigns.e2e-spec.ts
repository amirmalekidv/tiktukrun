import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Campaigns Module (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let createdCampaignId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    adminToken = process.env.ADMIN_JWT_TOKEN ?? 'admin-token';
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/admin/campaigns should return campaigns list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/admin/campaigns should create campaign', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'کمپین تست',
        type: 'INAPP',
        content: {
          subject: 'پیشنهاد ویژه',
          body: 'سلام {{name}}، یک تخفیف ویژه برای شماست!',
        },
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('کمپین تست');
    createdCampaignId = res.body.data.id;
  });

  it('POST /api/v1/admin/campaigns/:id/start should start campaign', async () => {
    if (!createdCampaignId) return;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/campaigns/${createdCampaignId}/start`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/admin/campaigns/:id/pause should pause campaign', async () => {
    if (!createdCampaignId) return;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/campaigns/${createdCampaignId}/pause`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PAUSED');
  });

  it('GET /api/v1/admin/campaigns/stats should return KPIs', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/campaigns/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('totalSent');
    expect(res.body.data).toHaveProperty('conversionRate');
  });
});
