import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAIService } from './openai.service';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: 'AIService',
      useClass: OpenAIService,
    },
  ],
})
export class ChatModule {}
