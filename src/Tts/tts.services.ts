import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import OpenAI from 'openai';
import { createReadStream } from 'fs';

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
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(speechFile, buffer);
  }

  async transcribeAudio(filePath: string): Promise<string> {
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(filePath),
        model: 'whisper-1',
        response_format: 'text',
      });

      return transcription;
    } catch (error) {
      console.error('Erreur lors de la transcription:', error);
      throw error;
    }
  }
}
