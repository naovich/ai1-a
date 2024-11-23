import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TtsService } from './tts.services';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('audio')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Get('stream')
  streamAudio(@Res() res: Response) {
    const filePath = './temp/audio/speech.mp3';
    res.sendFile(filePath, { root: '.' });
  }

  @Post('getSpeech')
  generateSpeech(@Body() { text }: { text: string }): Promise<void> {
    return this.ttsService.generateSpeech(text);
  }

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './temp/audio/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
  )
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    try {
      const transcription = await this.ttsService.transcribeAudio(file.path);
      return { transcription };
    } catch (error) {
      return { error: 'Erreur lors de la transcription' };
    }
  }
}
