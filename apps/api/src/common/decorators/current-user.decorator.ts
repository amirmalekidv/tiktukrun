import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Returns the authenticated user object from the request.
 * Usage:
 *   @CurrentUser() user — returns the entire user object
 *   @CurrentUser('id') userId — returns user.id
 *   @CurrentUser('mobile') mobile — returns user.mobile
 *
 * [QA Fix 2026-05-25] Previously always returned the entire request.user,
 * causing AuthService.getMe(userId) to receive the user object instead of just the id.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
