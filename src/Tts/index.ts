import { Module } from '@nestjs/common';
import { TtsService } from './tts.services';
import { TtsController } from './tss.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './temp/users/admin/audio/uploads',
    }),
  ],
  controllers: [TtsController],
  providers: [TtsService],
})
export class TTSModule {}
