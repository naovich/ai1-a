import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { IoService } from './io.service';

@Controller('io')
export class IoController {
  constructor(private readonly ioService: IoService) {}

  @Get('mouse-position')
  getMousePosition() {
    return this.ioService.getMousePosition();
  }

  @Post('move-mouse')
  moveMouse(@Body('x') x: number, @Body('y') y: number) {
    return this.ioService.moveMouse(x, y);
  }

  @Post('click-mouse')
  clickMouse() {
    return this.ioService.clickMouse();
  }

  @Post('type-string')
  typeString(@Body('text') text: string) {
    return this.ioService.typeString(text);
  }

  @Get('capture-screen')
  captureScreen(
    @Query('x') x: number,
    @Query('y') y: number,
    @Query('width') width: number,
    @Query('height') height: number,
    @Query('format') format: 'raw' | 'base64' | 'png' | 'jpg',
  ) {
    return this.ioService.captureScreen(x, y, width, height, format);
  }
}
