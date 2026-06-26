import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [TicketsModule],
  controllers: [PublicController],
})
export class PublicModule {}
