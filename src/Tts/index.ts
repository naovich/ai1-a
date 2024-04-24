import { Module } from '@nestjs/common';
import { TtsService } from './tts.services';
import { TtsController } from './tss.controller';

@Module({
  controllers: [TtsController],
  providers: [TtsService],
})
export class TTSModule {}
