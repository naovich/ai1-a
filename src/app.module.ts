import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat';
import { TTSModule } from './Tts';
import { CommandModule } from './commands';

@Module({
  imports: [ConfigModule.forRoot(), ChatModule, TTSModule, CommandModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
