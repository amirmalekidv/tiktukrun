import { Module, Global } from '@nestjs/common';
import { AdminRolesController } from './admin-roles.controller';
import { AdminUserRolesController } from './admin-user-roles.controller';
import { RolesService } from './roles.service';

@Global()
@Module({
  controllers: [AdminRolesController, AdminUserRolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
