import { Module } from '@nestjs/common';
import { AdminCustomersController } from './admin-customers.controller';
import { CustomersService } from './customers.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AdminCustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
