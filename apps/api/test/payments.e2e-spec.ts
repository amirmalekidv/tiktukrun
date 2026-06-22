import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Payments verify (e2e)', () => {
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

  it('GET /api/v1/payments/zarinpal/verify — redirects when payment is missing', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/payments/zarinpal/verify')
      .query({ Authority: 'TEST_missing', Status: 'OK', paymentId: '000000000000000000000000' })
      .expect(302);

    expect(res.headers.location).toContain('/wallet?status=error');
  });

  it('GET /api/v1/payments/zarinpal/verify — is a public route (no auth required)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/payments/zarinpal/verify')
      .query({ Authority: 'TEST_x', Status: 'NOK', paymentId: '000000000000000000000001' })
      .expect(302);
  });
});
