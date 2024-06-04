import { Controller, Post, Body, Get } from '@nestjs/common';
import { TvService } from './tv.service';

@Controller('tv')
export class TvController {
  constructor(private readonly tvService: TvService) {}

  @Post('turn-on')
  async turnOnTv() {
    await this.tvService.turnOnTv();
    return { message: 'Turning on TV' };
  }

  @Post('turn-off')
  async turnOffTv() {
    await this.tvService.turnOffTv();
    return { message: 'Turning off TV' };
  }

  @Post('open-app')
  async openApp(@Body('appId') appId: string) {
    await this.tvService.openApp(appId);
    return { message: `Opening app: ${appId}` };
  }

  @Post('set-volume')
  async setVolume(@Body('level') level: number) {
    await this.tvService.setVolume(level);
    return { message: `Setting volume to: ${level}` };
  }

  @Post('get-volume')
  async getVolume() {
    const volume = await this.tvService.getVolume();
    return { volume };
  }

  @Post('volume-up')
  async volumeUp() {
    await this.tvService.volumeUp();
    return { message: `Volume Up` };
  }

  @Post('volume-down')
  async volumeDown() {
    await this.tvService.volumeDown();
    return { message: `Volume Down` };
  }

  @Post('mute')
  async mute() {
    await this.tvService.mute();
    return { message: `Muting TV` };
  }

  @Post('unmute')
  async unmute() {
    await this.tvService.unmute();
    return { message: `Unmuting TV` };
  }

  @Post('toggle-mute')
  async toggleMute() {
    await this.tvService.toggleMute();
    return { message: `Toggling mute` };
  }

  @Post('send-key')
  async sendKey(@Body('key') key: string) {
    await this.tvService.sendKey(key);
    return { message: `Sending key: ${key}` };
  }

  @Post('send-enter-key')
  async sendEnterKey() {
    await this.tvService.sendEnterKey();
    return { message: `Send enter key` };
  }

  @Get('list-apps')
  async listApps() {
    const apps = await this.tvService.listApps();
    return apps;
  }

  @Post('play')
  async play() {
    await this.tvService.play();
    return { message: `Playing TV` };
  }

  @Post('pause')
  async pause() {
    await this.tvService.pause();
    return { message: `Pausing TV` };
  }

  @Post('stop')
  async stop() {
    await this.tvService.stop();
    return { message: `Stopping TV` };
  }

  @Post('channel-up')
  async channelUp() {
    await this.tvService.channelUp();
    return { message: `Channel Up` };
  }

  @Post('channel-down')
  async channelDown() {
    await this.tvService.channelDown();
    return { message: `Channel Down` };
  }
  @Post('back')
  async closeApp() {
    await this.tvService.back();
    return { message: `back ` };
  }

  @Post('home')
  async home() {
    await this.tvService.home();
    return { message: `home ` };
  }

  @Post('rewind')
  async rewind() {
    await this.tvService.rewind();
    return { message: `rewind ` };
  }
  @Post('fastForward')
  async fastForward() {
    await this.tvService.fastForward();
    return { message: `fastForward ` };
  }

  @Post('click')
  async getPointerInputSocketClick() {
    await this.tvService.click();
    return { message: `getPointerInputSocketClick ` };
  }

  //button
  @Post('button')
  async button(@Body('button') button: string) {
    await this.tvService.button(button);
    return { message: `button ` };
  }

  @Post('channel-list')
  async channelList() {
    const channels = await this.tvService.getChannelList();
    return channels;
  }

  @Post('create-toast')
  async createToast(@Body('message') message: string) {
    await this.tvService.createToast(message);
    return { message: `Creating toast: ${message}` };
  }
}
