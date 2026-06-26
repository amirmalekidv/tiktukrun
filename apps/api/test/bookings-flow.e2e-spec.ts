/**
 * Booking lifecycle e2e — preview → create (wallet) → admin complete → rewards
 * Requires MongoDB with seeded data (game + admin user).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { DateTime } from 'luxon';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Booking flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let userToken: string;
  let adminToken: string;
  let testUserId: string;
  let gameId: string;
  let bookingId: string;
  const testMobile = '09998887766';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    const game = await prisma.game.findFirst({ where: { isActive: true } });
    if (!game) {
      console.warn('Skipping booking flow e2e: no active game in DB');
      return;
    }
    gameId = game.id;

    await prisma.user.deleteMany({ where: { mobile: testMobile } });
    const user = await prisma.user.create({
      data: {
        mobile: testMobile,
        fullName: 'E2E Booking User',
        role: 'CUSTOMER',
        profile: { create: { levelId: 1, xp: 0 } },
        wallet: { create: { tomanBalance: 50_000_000, coinsBalance: 0 } },
      },
    });
    testUserId = user.id;

    const admin = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });

    userToken = jwt.sign({ sub: testUserId, role: 'CUSTOMER' });
    adminToken = admin
      ? jwt.sign({ sub: admin.id, role: admin.role })
      : userToken;
  });

  afterAll(async () => {
    if (bookingId) {
      await prisma.transaction.deleteMany({
        where: { refId: bookingId },
      });
      await prisma.payment.deleteMany({ where: { bookingId } });
      await prisma.booking.deleteMany({ where: { id: bookingId } });
    }
    await prisma.user.deleteMany({ where: { mobile: testMobile } });
    await app?.close();
  });

  it('POST preview — returns pricing and reward hints', async () => {
    if (!gameId) return;

    const slot = DateTime.now()
      .setZone('Asia/Tehran')
      .plus({ days: 2, hours: 3 })
      .startOf('hour')
      .toISO();

    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings/preview')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        gameId,
        slotDateTime: slot,
        playersCount: 2,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.finalPrice).toBeDefined();
    expect(res.body.data.xpReward).toBeGreaterThan(0);
    expect(res.body.data.coinReward).toBeGreaterThan(0);
  });

  it('POST create — wallet payment confirms booking', async () => {
    if (!gameId) return;

    const slot = DateTime.now()
      .setZone('Asia/Tehran')
      .plus({ days: 2, hours: 4 })
      .startOf('hour')
      .toISO();

    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        gameId,
        slotDateTime: slot,
        playersCount: 2,
        paymentMethod: 'WALLET',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
    bookingId = res.body.data.bookingId;

    const tx = await prisma.transaction.findFirst({
      where: { refId: bookingId, type: 'BOOKING_PAYMENT' },
    });
    expect(tx).toBeTruthy();
    expect(tx?.refType).toBe('BOOKING');
  });

  it('POST admin complete — awards XP/coins', async () => {
    if (!bookingId) return;

    const profileBefore = await prisma.userProfile.findUnique({
      where: { userId: testUserId },
    });
    const xpBefore = profileBefore?.xp ?? 0;

    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(booking?.status).toBe('COMPLETED');

    const profileAfter = await prisma.userProfile.findUnique({
      where: { userId: testUserId },
    });
    expect((profileAfter?.xp ?? 0)).toBeGreaterThan(xpBefore);

    const coinTx = await prisma.transaction.findFirst({
      where: { refId: bookingId, currency: 'COINS' },
    });
    expect(coinTx).toBeTruthy();
  });

  it('POST review — only allowed for completed booking', async () => {
    if (!bookingId) return;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/reviews/booking/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, text: 'تست e2e' })
      .expect(201);

    expect(res.body.id).toBeDefined();
  });
});
