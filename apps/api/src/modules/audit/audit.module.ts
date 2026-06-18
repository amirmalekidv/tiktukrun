import { Module, Global } from '@nestjs/common';
import { AdminAuditController } from './admin-audit.controller';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';

@Global()
@Module({
  controllers: [AdminAuditController],
  // FIX: AuditInterceptor must be registered as a provider so NestJS DI can
  // resolve it when used via @UseInterceptors(AuditInterceptor) class reference
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
