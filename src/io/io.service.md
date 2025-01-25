import { Injectable } from '@nestjs/common';
import * as robot from 'robotjs';
import { PNG } from 'pngjs';
import * as jpeg from 'jpeg-js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class IoService {
  getMousePosition() {
    const mouse = robot.getMousePos();
    return { x: mouse.x, y: mouse.y };
  }

  moveMouse(x: number, y: number) {
    robot.moveMouse(x, y);
    return { message: `Mouse moved to (${x}, ${y})` };
  }

  clickMouse() {
    robot.mouseClick();
    return { message: 'Mouse clicked' };
  }

  typeString(text: string) {
    robot.typeString(text);
    return { message: `Typed string: ${text}` };
  }

  captureScreen(
    x: number,
    y: number,
    width: number,
    height: number,
    format: 'raw' | 'base64' | 'png' | 'jpg',
  ) {
    const img = robot.screen.capture(x, y, width, height);

    const png = new PNG({ width: img.width, height: img.height });
    let pos = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const i = y * img.byteWidth + x * img.bytesPerPixel;
        const r = img.image[i + 2];
        const g = img.image[i + 1];
        const b = img.image[i];
        const a = img.image[i + 3];
        const idx = pos++;
        png.data[idx * 4] = r;
        png.data[idx * 4 + 1] = g;
        png.data[idx * 4 + 2] = b;
        png.data[idx * 4 + 3] = a;
      }
    }

    if (format === 'raw') {
      return {
        image: img.image,
        width: img.width,
        height: img.height,
        byteWidth: img.byteWidth,
        bitsPerPixel: img.bitsPerPixel,
        bytesPerPixel: img.bytesPerPixel,
      };
    } else if (format === 'base64') {
      const buffer = PNG.sync.write(png);
      const base64 = buffer.toString('base64');
      return {
        format: 'base64',
        data: base64,
      };
    } else if (format === 'png') {
      const desktopDir = path.join(os.homedir(), 'Desktop');
      const filePath = path.join(desktopDir, 'screenshot.png');
      png.pack().pipe(fs.createWriteStream(filePath));
      return {
        format: 'png',
        path: filePath,
      };
    } else if (format === 'jpg') {
      const jpegData = jpeg.encode(
        {
          data: png.data,
          width: img.width,
          height: img.height,
        },
        100,
      );

      const desktopDir = path.join(os.homedir(), 'Desktop');
      const filePath = path.join(desktopDir, 'screenshot.jpg');
      fs.writeFileSync(filePath, jpegData.data);
      return {
        format: 'jpg',
        path: filePath,
      };
    }
  }
}
