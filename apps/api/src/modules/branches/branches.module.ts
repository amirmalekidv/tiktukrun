import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController, BranchesAdminController } from './branches.controller';

@Module({
  controllers: [BranchesController, BranchesAdminController],
  providers:   [BranchesService],
  exports:     [BranchesService],
})
export class BranchesModule {}
