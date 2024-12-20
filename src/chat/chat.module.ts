import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAIService } from './openai.service';
import { AnthropicService } from './anthropic.service';
import { GeminiService } from './gemini.service';
import { PerplexityService } from './perplexity.service';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: 'AIService',
      useFactory: () => {
        const defaultProvider = process.env.AI_PROVIDER || 'openai';
        return {
          anthropic: new AnthropicService(),
          openai: new OpenAIService(),
          gemini: new GeminiService(),
          perplexity: new PerplexityService(),
          defaultProvider,
        };
      },
    },
  ],
})
export class ChatModule {}
