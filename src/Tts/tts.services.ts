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
  private cleanText(text: string): string {
    // Supprimer les URLs (http, https, www)
    return (
      text
        .replace(/(?:https?:\/\/|www\.)[^\s]+/g, '')
        // Supprimer les doubles espaces créés
        .replace(/\s+/g, ' ')
        // Nettoyer les espaces au début et à la fin
        .trim()
    );
  }

  async generateSpeech(text: string, speed: number = 1.0): Promise<void> {
    const cleanedText = this.cleanText(text);

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: cleanedText,
      speed: speed, // Valeur entre 0.25 et 4.0
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const directory = path.dirname(speechFile);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(speechFile, buffer);
  }

  async transcribeAudio(filePath: string): Promise<string> {
    try {
      // Vérifier que le fichier existe et est un fichier audio valide
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error("Le chemin spécifié n'est pas un fichier.");
      }

      const validExtensions = ['.mp3', '.wav', '.flac', '.webm'];
      const fileExtension = path.extname(filePath).toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        throw new Error(
          'Format de fichier non supporté. Formats supportés: .mp3, .wav, .flac, .webm',
        );
      }

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
