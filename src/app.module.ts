import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { TTSModule } from './Tts';
import { CommandModule } from './commands';

import { IoModule } from './io';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ChatModule,
    TTSModule,
    CommandModule,
    IoModule,
  ],
})
export class AppModule {}
