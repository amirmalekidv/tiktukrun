import { Module, forwardRef } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { AdminChatController } from './admin-chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController, AdminChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
