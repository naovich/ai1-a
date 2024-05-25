import { Injectable } from '@nestjs/common';
import { Yeelight } from 'yeelight-awesome';

@Injectable()
export class LightService {
  private yeelight: Yeelight;

  constructor() {
    this.yeelight = new Yeelight({
      lightIp: '192.168.1.11',
      lightPort: 55443,
    });

    this.yeelight.connect();
  }

  async turnOn(): Promise<void> {
    try {
      await this.yeelight.setPower(true);
      console.log('Light turned on');
    } catch (error) {
      console.error('Error turning on the light:', error);
    }
  }

  async turnOff(): Promise<void> {
    try {
      await this.yeelight.setPower(false);
      console.log('Light turned off');
    } catch (error) {
      console.error('Error turning off the light:', error);
    }
  }

  async setBrightness(brightness: number): Promise<void> {
    try {
      await this.yeelight.setBright(brightness);
      console.log(`Brightness set to ${brightness}`);
    } catch (error) {
      console.error('Error setting brightness:', error);
    }
  }

  async setHsl(hue: number, saturation: number): Promise<void> {
    try {
      await this.yeelight.setHSV(hue, saturation);
      console.log(`HSL set to ${hue}, ${saturation}`);
    } catch (error) {
      console.error('Error setting HSL:', error);
    }
  }

  async setColorTemperature(temperature: number): Promise<void> {
    try {
      await this.yeelight.setCtAbx(temperature);
      console.log(`Color temperature set to ${temperature}`);
    } catch (error) {
      console.error('Error setting color temperature:', error);
    }
  }
}
