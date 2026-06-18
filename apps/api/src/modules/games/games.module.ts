import { Module }             from '@nestjs/common';
import { GamesController, GamesAdminController } from './games.controller';
import {
  GameInteractionController,
  GameCommentsAdminController,
} from './game-interaction.controller';
import { GamesService }       from './services/games.service';
import { GamesAdminService }  from './services/games-admin.service';
import { GameImageService }   from './services/game-image.service';
import { GameInteractionService } from './services/game-interaction.service';

@Module({
  controllers: [
    GamesController,
    GamesAdminController,
    GameInteractionController,
    GameCommentsAdminController,
  ],
  providers:   [
    GamesService,
    GamesAdminService,
    GameImageService,
    GameInteractionService,
  ],
  exports:     [GamesService, GameInteractionService],
})
export class GamesModule {}
