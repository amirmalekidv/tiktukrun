import { Module } from '@nestjs/common';
import { ReviewsController, ReviewsAdminController } from './reviews.controller';
import { ReviewsService }       from './reviews.service';
import { NotificationsService } from '../../common/interfaces/notifications-stub.service';
import { BookingRewardsService } from '../bookings/services/booking-rewards.service';

@Module({
  controllers: [ReviewsController, ReviewsAdminController],
  providers:   [ReviewsService, NotificationsService, BookingRewardsService],
  exports:     [ReviewsService],
})
export class ReviewsModule {}
