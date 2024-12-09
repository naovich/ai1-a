import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import OpenAI from 'openai';
import { createReadStream, createWriteStream } from 'fs';
import * as path from 'path';
import axios from 'axios';
import { ElevenLabsClient } from 'elevenlabs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const speechFile = './temp/users/admin/audio/downloads/speech.mp3';

type TtsProvider = 'openai' | 'minimax' | 'elevenlabs';

const openapiVoices = {
  name: 'alloy',
  language: 'en',
};

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  language: string;
  accent: string;
  description: string;
  age: string;
  gender: string;
  use_case: string;
}

const elevenLabsVoices: ElevenLabsVoice[] = [
  {
    voice_id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    language: 'fr',
    accent: 'french',
    description: 'seductive',
    age: 'young',
    gender: 'female',
    use_case: 'characters',
  },
  {
    voice_id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    language: 'en',
    accent: 'american',
    description: 'articulate',
    age: 'young',
    gender: 'male',
    use_case: 'narration',
  },
  {
    voice_id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    language: 'en',
    accent: 'american',
    description: 'seductive',
    age: 'middle-aged',
    gender: 'female',
    use_case: 'narration',
  },
  {
    voice_id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lilly',
    language: 'en',
    accent: 'american',
    description: 'warm',
    age: 'middle-aged',
    gender: 'female',
    use_case: 'narration',
  },
  ,
  {
    voice_id: 'bIHbv24MWmeRgasZH58o',
    name: 'Will',
    language: 'en',
    accent: 'american',
    description: 'friendly',
    age: 'young',
    gender: 'male',
    use_case: 'narration',
  },
  {
    voice_id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    language: 'en',
    accent: 'american',
    description: 'friendly',
    age: 'young',
    gender: 'male',
    use_case: 'narration',
  },
  {
    voice_id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    language: 'en',
    accent: 'american',
    description: 'friendly',
    age: 'young',
    gender: 'male',
    use_case: 'narration',
  },
  {
    voice_id: 'pqHfZKP75CvOlQylNhV4',
    name: 'Bill',
    language: 'en',
    accent: 'american',
    description: 'trustworthy',
    age: 'young',
    gender: 'male',
    use_case: 'narration',
  },
];

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

  async generateSpeech(
    text: string,
    speed: number = 1.0,
    provider: TtsProvider = 'openai',
  ): Promise<void> {
    const cleanedText = this.cleanText(text);

    if (provider === 'openai') {
      await this.generateOpenAISpeech(cleanedText, speed);
    } else if (provider === 'minimax') {
      await this.generateMinimaxSpeech(cleanedText, speed);
    } else if (provider === 'elevenlabs') {
      await this.generateElevenLabsSpeech(cleanedText);
    }
  }

  private async generateOpenAISpeech(
    text: string,
    speed: number,
  ): Promise<void> {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: openapiVoices.name as
        | 'alloy'
        | 'echo'
        | 'fable'
        | 'onyx'
        | 'nova'
        | 'shimmer',
      input: text,
      speed: speed,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const directory = path.dirname(speechFile);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(speechFile, buffer);
  }

  private async generateMinimaxSpeech(
    text: string,
    speed: number,
  ): Promise<void> {
    try {
      const response = await axios({
        method: 'post',
        url: `https://api.minimaxi.chat/v1/t2a_v2?GroupId=${process.env.MINIMAX_GROUP_ID}`,
        headers: {
          Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        data: {
          model: 'speech-01-turbo',
          text: text,
          stream: false,
          voice_setting: {
            voice_id: 'Calm_Woman',
            speed: speed,
            vol: 1,
            pitch: 0,
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: 'mp3',
            channel: 1,
          },
        },
        responseType: 'arraybuffer',
      });

      const directory = path.dirname(speechFile);
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(speechFile, response.data);
    } catch (error) {
      console.error('Erreur lors de la génération audio avec Minimax:', error);
      throw error;
    }
  }

  private async generateElevenLabsSpeech(text: string): Promise<void> {
    try {
      const audio = await elevenlabs.textToSpeech.convert(
        elevenLabsVoices[0].voice_id,
        {
          model_id: 'eleven_multilingual_v2',
          text: text,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 1, // Utilisation du paramètre speed pour le style
            use_speaker_boost: true,
          },
        },
      );

      const directory = path.dirname(speechFile);
      await fs.mkdir(directory, { recursive: true });

      const fileStream = createWriteStream(speechFile);
      audio.pipe(fileStream);

      return new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
    } catch (error) {
      console.error(
        'Erreur lors de la génération audio avec ElevenLabs:',
        error,
      );
      throw error;
    }
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
