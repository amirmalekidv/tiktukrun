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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { CurrentUserPayload } from '@tiktakrun/shared-types';
import { getStorageDir } from '../../common/utils/storage-path';

import { GamesService }      from './services/games.service';
import { GamesAdminService } from './services/games-admin.service';
import { GameQueryDto }      from './dto/game-query.dto';
import { CreateGameDto, UpdateGameDto, WeeklyDiscountDto } from './dto/create-game.dto';
import { ReviewsService }    from '../reviews/reviews.service';

import { Public }          from '../../common/decorators/public.decorator';
import { CurrentUser }     from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard }    from '../../common/guards/jwt-auth.guard';
import { RolesGuard }      from '../../common/guards/roles.guard';
import { Roles }           from '../../common/decorators/roles.decorator';
import { toBranchScope } from '../../common/helpers/branch-scope.helper';
import { BRANCH_OPS_ROLES, PLATFORM_ADMIN_ROLES } from '../../common/constants/admin-roles';

// ─── Multer config ─────────────────────────────────────────────────────────────
const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getStorageDir('tmp'));
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`);
  },
});

// ─── Public Games Controller ──────────────────────────────────────────────────
@Controller('games')
export class GamesController {
  constructor(
    private readonly svc: GamesService,
    private readonly reviewsSvc: ReviewsService,
  ) {}

  @Public()
  @Get()
  findMany(@Query() query: GameQueryDto) {
    return this.svc.findMany(query);
  }

  @Public()
  @Get('featured/hero')
  featuredHero() {
    return this.svc.findFeaturedHero();
  }

  @Public()
  @Get('by-section/:section')
  bySection(@Param('section') section: string) {
    return this.svc.findBySection(section);
  }

  @Public()
  @Get('availability/:gameId')
  availability(
    @Param('gameId') gameId: string,
    @Query('date') date: string,
  ) {
    return this.svc.getAvailability(gameId, date);
  }

  /** Alias for web client: GET /games/:gameId/reviews → reviews module */
  @Public()
  @Get(':gameId/reviews')
  findReviewsForGame(
    @Param('gameId') gameId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.reviewsSvc.findForGame(gameId, query);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }
}

// ─── Admin Games Controller ────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...BRANCH_OPS_ROLES)
@Controller('admin/games')
export class GamesAdminController {
  constructor(private readonly svc: GamesAdminService) {}

  @Get()
  findAll(
    @Query() query: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.findAll(query, toBranchScope(user));
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.findOne(id, toBranchScope(user));
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover',   maxCount: 1 },
        { name: 'gallery', maxCount: 10 },
        { name: 'teaser',  maxCount: 1 },
      ],
      { storage: multerStorage, limits: { fileSize: 50 * 1024 * 1024 } },
    ),
  )
  create(
    @Body() dto: CreateGameDto,
    @UploadedFiles()
    files: {
      cover?:   Express.Multer.File[];
      gallery?: Express.Multer.File[];
      teaser?:  Express.Multer.File[];
    },
  ) {
    return this.svc.create(dto, files);
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover',   maxCount: 1 },
        { name: 'gallery', maxCount: 10 },
        { name: 'teaser',  maxCount: 1 },
      ],
      { storage: multerStorage, limits: { fileSize: 50 * 1024 * 1024 } },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGameDto,
    @UploadedFiles()
    files: {
      cover?:   Express.Multer.File[];
      gallery?: Express.Multer.File[];
      teaser?:  Express.Multer.File[];
    },
  ) {
    return this.svc.update(id, dto, files);
  }

  @Post(':id/images')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'images', maxCount: 10 }],
      { storage: multerStorage, limits: { fileSize: 5 * 1024 * 1024 } },
    ),
  )
  addImages(
    @Param('id') id: string,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    return this.svc.addImages(id, files?.images ?? []);
  }

  @Delete(':id/images/:imageId')
  deleteImage(
    @Param('id') gameId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.svc.deleteImage(gameId, imageId);
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Post(':id/toggle-featured')
  toggleFeatured(@Param('id') id: string) {
    return this.svc.toggleFeatured(id);
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Post(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.svc.toggleActive(id);
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.svc.softDelete(id);
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Patch(':id/weekly-discount')
  setWeeklyDiscount(@Param('id') id: string, @Body() dto: WeeklyDiscountDto) {
    return this.svc.setWeeklyDiscount(id, dto);
  }

  @Post(':id/recompute-rank')
  recomputeRank(@Param('id') id: string) {
    return this.svc.recomputeRank(id);
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Patch(':id/tier')
  setTier(@Param('id') id: string, @Body('tier') tier: string) {
    return this.svc.setTier(id, tier);
  }
}
