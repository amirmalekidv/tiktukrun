import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from './audit.interceptor';

export const AUDIT_KEY = 'audit_action';

/**
 * Decorator to automatically log audit entries
 * Usage: @Audit('entity.action')
 */
export const Audit = (action: string) =>
  applyDecorators(
    SetMetadata(AUDIT_KEY, action),
    UseInterceptors(AuditInterceptor),
  );
