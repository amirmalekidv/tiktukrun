import { Module }            from '@nestjs/common';
import { BookingsController, BookingsAdminController } from './bookings.controller';
import { BookingsService }       from './services/bookings.service';
import { BookingsAdminService }  from './services/bookings-admin.service';
import { BookingStateMachine }   from './services/booking-state-machine.service';
import { BookingRewardsService } from './services/booking-rewards.service';
import { BookingCronService }    from './services/booking-cron.service';
import { DiscountsModule }       from '../discounts/discounts.module';
import { PaymentsModule }        from '../payments/payments.module';
import { NotificationsService }  from '../../common/interfaces/notifications-stub.service';
import { WalletService }         from '../../common/interfaces/wallet-stub.service';

// ScheduleModule.forRoot() در app.module.ts ثبت شده — نباید تکرار شود
@Module({
  imports: [
    DiscountsModule,
    PaymentsModule,
  ],
  controllers: [BookingsController, BookingsAdminController],
  providers: [
    BookingsService,
    BookingsAdminService,
    BookingStateMachine,
    BookingRewardsService,
    BookingCronService,
    NotificationsService,
    WalletService,
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
