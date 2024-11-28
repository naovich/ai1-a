import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { AIService, AIProvider, AIResponse } from './ai.interface';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

type ModelProps = 'gemini-pro' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export class GeminiService implements AIService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  private defaultModel: ModelProps = 'gemini-1.5-pro';

  async getAnswer(
    prompt: string,
    systemContent: string = '',
    model: ModelProps = this.defaultModel,
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Parser 'prompt' en tableau de messages
      let formattedMessages: any[];
      try {
        formattedMessages = JSON.parse(prompt);
      } catch (error) {
        formattedMessages = [{ role: 'user', content: prompt }];
      }

      const geminiModel = this.genAI.getGenerativeModel({ model: model });

      // Préparer l'historique initial
      const initialHistory = systemContent
        ? [{ role: 'user', parts: [{ text: systemContent }] }]
        : [];

      // Formater les messages d'historique pour Gemini
      const history = await Promise.all(
        formattedMessages.slice(0, -1).map(async (msg) => {
          try {
            return {
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: await this.formatMessageContent(msg.content),
            };
          } catch (error) {
            console.error('Error formatting message in history:', error);
            return {
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: this.extractTextOnly(msg.content) }],
            };
          }
        }),
      );

      // Démarrer le chat avec l'historique formaté
      const chat = geminiModel.startChat({
        history: [...initialHistory, ...history].filter(Boolean),
        generationConfig: {
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      // Obtenir le dernier message (la dernière entrée de l'utilisateur)
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      const formattedLastMessage = await this.formatMessageContent(
        lastMessage.content,
      );

      try {
        const result = await chat.sendMessage(formattedLastMessage);
        const response = await result.response;

        return {
          role: 'assistant',
          content: response.text(),
          provider: 'gemini' as AIProvider,
          metadata: {
            timestamp: new Date().toISOString(),
            model: model,
            responseTime: Date.now() - startTime,
            status: 'success',
          },
        };
      } catch (error) {
        console.error('Error during chat.sendMessage:', error);
        throw error;
      }
    } catch (error) {
      console.error('Gemini error:', error);
      return {
        role: 'assistant',
        content:
          'Désolé, une erreur est survenue lors du traitement de votre demande.',
        provider: 'gemini',
        metadata: {
          timestamp: new Date().toISOString(),
          model: model,
          responseTime: Date.now() - startTime,
          status: 'error',
          errorDetails: {
            code: error.code || 'UNKNOWN',
            message: error.message,
          },
        },
      };
    }
  }

  async generateSpeech(text: string): Promise<Buffer> {
    const mp3 = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    return Buffer.from(await mp3.arrayBuffer());
  }

  private async formatMessageContent(content: any): Promise<any[]> {
    if (Array.isArray(content)) {
      const formattedParts = [];

      for (const item of content) {
        if (item.type === 'text') {
          formattedParts.push({ text: item.text });
        } else if (item.type === 'image_url') {
          try {
            let imageData: string;
            let mimeType: string;

            if (item.image_url.url.startsWith('data:')) {
              const [mimeInfo, data] = item.image_url.url.split(',');
              mimeType = mimeInfo.split(':')[1].split(';')[0];
              imageData = data;
            } else {
              const response = await fetch(item.image_url.url);
              const arrayBuffer = await response.arrayBuffer();
              const contentType =
                response.headers.get('content-type') || 'image/jpeg';
              imageData = Buffer.from(arrayBuffer).toString('base64');
              mimeType = contentType;
            }

            formattedParts.push({
              inlineData: {
                data: imageData,
                mimeType: mimeType,
              },
            });
          } catch (error) {
            console.error('Error processing image:', error);
            formattedParts.push({
              text: `[Image non chargée: ${item.image_url.url}]`,
            });
          }
        }
      }
      return formattedParts;
    }

    return [{ text: content }];
  }

  private extractTextOnly(content: any): string {
    if (Array.isArray(content)) {
      return content
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join(' ');
    }
    return content.toString();
  }
}
