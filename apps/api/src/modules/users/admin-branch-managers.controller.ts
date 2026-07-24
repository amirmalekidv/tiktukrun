import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@tiktakrun/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateBranchManagerDto } from './dto/create-branch-manager.dto';
import { UsersService } from './users.service';

@ApiTags('Admin — Branch Managers')
@ApiBearerAuth()
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('admin/branch-managers')
export class AdminBranchManagersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'لیست مدیران شعبه' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(@Query() query: Record<string, unknown>) {
    const result = await this.usersService.adminListBranchManagers(query);
    return { success: true, ...result };
  }

  @Post()
  @ApiOperation({
    summary: 'ایجاد مدیر شعبه جدید',
    description:
      'کاربر با نقش BRANCH_MANAGER ساخته می‌شود، به شعبه وصل می‌شود و یک رمز موقت برمی‌گردد تا با سوپرادمین به اشتراک گذاشته شود.',
  })
  async create(
    @Body() dto: CreateBranchManagerDto,
    @CurrentUser('id') adminId: string,
  ) {
    const data = await this.usersService.adminCreateBranchManager(dto, adminId);
    return {
      success: true,
      data,
      message: 'مدیر شعبه ایجاد شد — رمز موقت را همین حالا ذخیره کنید',
    };
  }
}
