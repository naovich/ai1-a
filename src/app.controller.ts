import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/stream')
  streamAudio(@Res() res: Response) {
    const filePath = './speech.mp3';
    res.sendFile(filePath, { root: '.' });
  }
}
