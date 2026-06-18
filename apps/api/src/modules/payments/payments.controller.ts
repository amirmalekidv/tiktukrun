import {
  Controller,
  Get,
  Query,
  Param,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public }          from '../../common/decorators/public.decorator';
import { JwtAuthGuard }    from '../../common/guards/jwt-auth.guard';
import { RolesGuard }      from '../../common/guards/roles.guard';
import { Roles }           from '../../common/decorators/roles.decorator';
import { UserRole }        from '../../common/interfaces/phase3-stubs.interface';

// ─── ZarinPal Callback (Public) ────────────────────────────────────────────────
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Public()
  @Get('zarinpal/verify')
  @Redirect()
  async zarinpalVerify(
    @Query('Authority') authority: string,
    @Query('Status')    status:    string,
    @Query('paymentId') paymentId: string,
  ) {
    const url = await this.svc.verifyCallback(authority, status, paymentId);
    return { url };
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class PaymentsAdminController {
  constructor(private readonly svc: PaymentsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
