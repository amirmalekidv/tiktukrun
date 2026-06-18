import { Module } from '@nestjs/common';
import { DiscountsController, DiscountsAdminController } from './discounts.controller';
import { DiscountsService }        from './services/discounts.service';
import { DiscountResolverService } from './services/discount-resolver.service';

@Module({
  controllers: [DiscountsController, DiscountsAdminController],
  providers:   [DiscountsService, DiscountResolverService],
  exports:     [DiscountResolverService],
})
export class DiscountsModule {}
