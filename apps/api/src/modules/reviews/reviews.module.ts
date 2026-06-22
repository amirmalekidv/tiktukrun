import { Module } from '@nestjs/common';
import { ReviewsController, ReviewsAdminController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports:     [BookingsModule],
  controllers: [ReviewsController, ReviewsAdminController],
  providers:   [ReviewsService],
  exports:     [ReviewsService],
})
export class ReviewsModule {}
