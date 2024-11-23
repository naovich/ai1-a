import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import OpenAI from 'openai';
import { createReadStream } from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const speechFile = './temp/users/admin/audio/downloads/speech.mp3';

@Injectable()
export class TtsService {
  async generateSpeech(text: string): Promise<void> {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const directory = path.dirname(speechFile);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(speechFile, buffer);
  }

  async transcribeAudio(filePath: string): Promise<string> {
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(filePath),
        model: 'whisper-1',
      });
      return transcription.text;
    } catch (error) {
      console.error('Erreur lors de la transcription:', error);
      throw error;
    }
  }
}
