import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { AdminChatController } from './admin-chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { TeamsController } from '../teams/teams.controller';
import { TeamsService } from '../teams/teams.service';

@Module({
  controllers: [ChatController, AdminChatController, TeamsController],
  providers: [ChatGateway, ChatService, TeamsService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
