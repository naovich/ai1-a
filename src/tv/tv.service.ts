import { Injectable } from '@nestjs/common';
import { promisify } from 'util';
import * as wol from 'wol';
import * as lgtv2 from 'lgtv2';

@Injectable()
export class TvService {
  private lgtv;

  constructor() {
    this.lgtv = lgtv2({
      url: `ws://${process.env.TV_IP_ADDRESS}:3000`,
    });

    this.lgtv.on('connect', () => {
      console.log('Connected to TV');
    });

    this.lgtv.on('close', () => {
      console.log('Disconnected from TV');
    });

    this.lgtv.on('error', (err: Error) => {
      console.error('Error:', err);
    });
  }

  async turnOnTv() {
    const wake = promisify(wol.wake);
    try {
      await wake(process.env.TV_MAC_ADDRESS);
      console.log('Wake-on-LAN packet sent');
    } catch (err) {
      console.error('Error waking up TV:', err);
    }
  }

  async turnOffTv() {
    this.lgtv.request('ssap://system/turnOff', (err: Error | null) => {
      if (err) {
        console.error('Error turning off TV:', err);
      } else {
        console.log('TV turned off');
      }
    });
  }

  async openApp(appId: string) {
    this.lgtv.request(
      'ssap://system.launcher/launch',
      { id: appId },
      (err: Error | null) => {
        if (err) {
          console.error('Error opening app:', err);
        } else {
          console.log('App opened:', appId);
        }
      },
    );
  }

  /*
  system.launcher/close
  system.launcher/getAppState
  system.launcher/launch
  */

  async setVolume(level: number) {
    this.lgtv.request(
      'ssap://audio/setVolume',
      { volume: level },
      (err: Error | null) => {
        if (err) {
          console.error('Error setting volume:', err);
        } else {
          console.log('Volume set to:', level);
        }
      },
    );
  }
  async mute() {
    this.lgtv.request(
      'ssap://audio/setMute',
      { mute: true },
      (err: Error | null) => {
        if (err) {
          console.error('Error muting:', err);
        } else {
          console.log('Muted');
        }
      },
    );
  }

  async unmute() {
    this.lgtv.request(
      'ssap://audio/setMute',
      { mute: false },
      (err: Error | null) => {
        if (err) {
          console.error('Error unmuting:', err);
        } else {
          console.log('Unmuted');
        }
      },
    );
  }

  async toggleMute() {
    this.lgtv.request(
      'ssap://audio/getStatus',
      (err: Error | null, res: { mute: boolean }) => {
        if (err) {
          console.error('Error getting mute status:', err);
        } else {
          if (res.mute) {
            this.unmute();
          } else {
            this.mute();
          }
        }
      },
    );
  }

  async getVolume(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.lgtv.request(
        'ssap://audio/getVolume',
        (err: Error | null, res: { volume: number }) => {
          if (err) {
            console.error('Error getting volume:', err);
            reject(err);
          } else {
            console.log('Current volume:', res.volume);
            resolve(res.volume);
          }
        },
      );
    });
  }

  async sendKey(key: string) {
    this.lgtv.request(
      'ssap://com.webos.service.ime/sendEnterKey',
      { key: key },
      (err: Error | null) => {
        if (err) {
          console.error('Error sending key:', err);
        } else {
          console.log('Key sent:', key);
        }
      },
    );
  }

  async listApps(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.lgtv.request(
        'ssap://com.webos.applicationManager/listLaunchPoints',
        (err: Error | null, res: any) => {
          if (err) {
            console.error('Error listing apps:', err);
            reject(err);
          } else {
            console.log('Installed apps:', res.launchPoints);
            resolve(res.launchPoints);
          }
        },
      );
    });
  }

  async play() {
    this.lgtv.request('ssap://media.controls/play', (err: Error | null) => {
      if (err) {
        console.error('Error playing:', err);
      } else {
        console.log('Playing');
      }
    });
  }

  async pause() {
    this.lgtv.request('ssap://media.controls/pause', (err: Error | null) => {
      if (err) {
        console.error('Error pausing:', err);
      } else {
        console.log('Paused');
      }
    });
  }

  async stop() {
    this.lgtv.request('ssap://media.controls/stop', (err: Error | null) => {
      if (err) {
        console.error('Error stopping:', err);
      } else {
        console.log('Stopped');
      }
    });
  }

  async channelDown() {
    this.lgtv.request('ssap://tv/channelDown', (err: Error | null) => {
      if (err) {
        console.error('Error channelDown:', err);
      } else {
        console.log('channelDown');
      }
    });
  }

  async channelUp() {
    this.lgtv.request('ssap://tv/channelUp', (err: Error | null) => {
      if (err) {
        console.error('Error channelUp:', err);
      } else {
        console.log('channelUp');
      }
    });
  }

  async getChannelList() {
    this.lgtv.request('ssap://tv/getChannelList', (err: Error | null) => {
      if (err) {
        console.error('Error getChannelList:', err);
      } else {
        console.log('getChannelList');
      }
    });
  }

  async getCurrentChannel() {
    this.lgtv.request('ssap://tv/getCurrentChannel', (err: Error | null) => {
      if (err) {
        console.error('Error getCurrentChannel:', err);
      } else {
        console.log('getCurrentChannel');
      }
    });
  }

  async createToast(message: string) {
    this.lgtv.request(
      'ssap://system.notifications/createToast',
      { message: message },
      (err: Error | null) => {
        if (err) {
          console.error('Error creating toast:', err);
        } else {
          console.log('Toast created:', message);
        }
      },
    );
  }
}
