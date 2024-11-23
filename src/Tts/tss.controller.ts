import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TtsService } from './tts.services';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs/promises';

const transcriptionFile = './temp/users/admin/audio/uploads';
let currentTranscriptionPath: string | null = null;

@Controller('audio')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {
    this.initializeUploadDirectory();
  }

  private async initializeUploadDirectory() {
    try {
      await fs.mkdir(transcriptionFile, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
    }
  }

  @Get('stream')
  streamAudio(@Res() res: Response) {
    const filePath = './temp/users/admin/audio/downloads/speech.mp3';
    res.sendFile(filePath, { root: '.' });
  }

  @Post('getSpeech')
  generateSpeech(@Body() { text }: { text: string }): Promise<void> {
    return this.ttsService.generateSpeech(text);
  }

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: async (req, file, cb) => {
          try {
            await fs.mkdir(transcriptionFile, { recursive: true });
            cb(null, transcriptionFile);
          } catch (error) {
            cb(error, null);
          }
        },
        filename: async (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = `${uniqueSuffix}-${file.originalname}`;

          // Supprimer l'ancien fichier seulement s'il existe
          if (currentTranscriptionPath) {
            try {
              await fs.access(currentTranscriptionPath);
              await fs.unlink(currentTranscriptionPath);
            } catch (error) {
              // Ignorer l'erreur si le fichier n'existe pas déjà
              console.log('Ancien fichier déjà supprimé ou inexistant');
            }
          }

          currentTranscriptionPath = `${transcriptionFile}/${filename}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    try {
      const transcription = await this.ttsService.transcribeAudio(file.path);

      setImmediate(async () => {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.error('Erreur lors de la suppression du fichier:', error);
        }
      });

      return { transcription };
    } catch (error) {
      return { error: 'Erreur lors de la transcription' };
    }
  }
}
