import { Injectable } from '@nestjs/common';
//import { promises as fsPromises } from 'fs';
//import path from 'path';
import { promises as fs } from 'fs';

import OpenAI from 'openai';

const openai = new OpenAI();
const speechFile = './temp/audio/speech.mp3';

@Injectable()
export class TtsService {
  async generateSpeech(text: string): Promise<void> {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    console.log(speechFile);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    console.log(buffer);
    await fs.writeFile(speechFile, buffer);
  }
}
