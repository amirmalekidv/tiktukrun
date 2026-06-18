import { Module }        from '@nestjs/common';
import { TopController } from './top.controller';
import { TopService }    from './top.service';

// CacheModule.register() با isGlobal:true در app.module.ts ثبت شده — نباید تکرار شود
@Module({
  controllers: [TopController],
  providers:   [TopService],
  exports:     [TopService],
})
export class TopModule {}
