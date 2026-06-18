import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersController, UsersAdminController } from './users.controller';
import { UsersService } from './users.service';
import { AvatarService } from './avatar.service';
import { LevelingService } from './leveling.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  ],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService, AvatarService, LevelingService],
  exports: [UsersService, LevelingService],
})
export class UsersModule {}
