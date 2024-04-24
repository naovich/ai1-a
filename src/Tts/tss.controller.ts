import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { TtsService } from './tts.services';
import { Response } from 'express';

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
}
