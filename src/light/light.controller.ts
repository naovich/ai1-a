import { Controller, Post, Body } from '@nestjs/common';
import { LightService } from './light.service';

@Controller('light')
export class LightController {
  constructor(private readonly lightService: LightService) {}

  @Post('turn-on')
  async turnOn() {
    await this.lightService.turnOn();
    return { message: 'Light turned on' };
  }

  @Post('turn-off')
  async turnOff() {
    await this.lightService.turnOff();
    return { message: 'Light turned off' };
  }

  @Post('set-brightness')
  async setBrightness(@Body('brightness') brightness: number) {
    await this.lightService.setBrightness(brightness);
    return { message: `Brightness set to ${brightness}` };
  }
  @Post('set-hsl')
  async setHsl(
    @Body('hue') hue: number,
    @Body('saturation') saturation: number,
  ) {
    await this.lightService.setHsl(hue, saturation);
    return { message: `HSL set to ${hue}, ${saturation}` };
  }

  @Post('set-color-temperature')
  async setColorTemperature(@Body('temperature') temperature: number) {
    await this.lightService.setColorTemperature(temperature);
    return { message: `Color temperature set to ${temperature}` };
  }
}
