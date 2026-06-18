import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DiscountsService }  from './services/discounts.service';
import {
  ValidateDiscountDto,
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  CreateAutoDiscountDto,
  UpdateAutoDiscountDto,
} from './dto/discount.dto';
import { CurrentUser }    from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard }   from '../../common/guards/jwt-auth.guard';
import { RolesGuard }     from '../../common/guards/roles.guard';
import { Roles }          from '../../common/decorators/roles.decorator';
import { UserRole, CurrentUserPayload } from '../../common/interfaces/phase3-stubs.interface';

// ─── Public / User ────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly svc: DiscountsService) {}

  @Post('validate')
  validate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ValidateDiscountDto,
  ) {
    return this.svc.validate(user.id, dto);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class DiscountsAdminController {
  constructor(private readonly svc: DiscountsService) {}

  // Discount Codes
  @Get('discount-codes')
  findAllCodes(@Query() query: any) {
    return this.svc.findAllCodes(query);
  }

  @Post('discount-codes')
  createCode(@Body() dto: CreateDiscountCodeDto) {
    return this.svc.createCode(dto);
  }

  @Patch('discount-codes/:id')
  updateCode(@Param('id') id: string, @Body() dto: UpdateDiscountCodeDto) {
    return this.svc.updateCode(id, dto);
  }

  @Delete('discount-codes/:id')
  deleteCode(@Param('id') id: string) {
    return this.svc.deleteCode(id);
  }

  @Get('discount-codes/:id/usages')
  getCodeUsages(@Param('id') id: string, @Query() query: any) {
    return this.svc.getCodeUsages(id, query);
  }

  // Auto Discounts
  @Get('auto-discounts')
  findAllAuto() {
    return this.svc.findAllAuto();
  }

  @Post('auto-discounts')
  createAuto(@Body() dto: CreateAutoDiscountDto) {
    return this.svc.createAuto(dto);
  }

  @Patch('auto-discounts/:id')
  updateAuto(@Param('id') id: string, @Body() dto: UpdateAutoDiscountDto) {
    return this.svc.updateAuto(id, dto);
  }

  @Delete('auto-discounts/:id')
  deleteAuto(@Param('id') id: string) {
    return this.svc.deleteAuto(id);
  }
}
