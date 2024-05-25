import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat';
import { TTSModule } from './Tts';
import { CommandModule } from './commands';
import { TvModule } from './tv';
import { LightModule } from './light';
import { IoModule } from './io';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ChatModule,
    TTSModule,
    CommandModule,
    TvModule,
    LightModule,
    IoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
