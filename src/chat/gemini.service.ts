import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { AIService, AIProvider, AIResponse } from './ai.interface';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

type ModelProps = 'gemini-pro' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export class GeminiService implements AIService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  private defaultModel: ModelProps = 'gemini-1.5-pro';
  private MAX_TOKENS = 4096;

  async getAnswer(
    prompt: string,
    model: ModelProps = this.defaultModel,
  ): Promise<AIResponse> {
    try {
      let formattedMessages: any[];
      try {
        formattedMessages = JSON.parse(prompt);
      } catch (error) {
        formattedMessages = [{ role: 'user', content: prompt }];
      }

      const geminiModel = this.genAI.getGenerativeModel({ model: model });

      const formattedAllMessages = await Promise.all(
        formattedMessages.map(async (msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: await this.formatMessageContent(msg.content),
        })),
      );

      const history = formattedAllMessages.slice(0, -1).filter(Boolean);
      const formattedLastMessage = formattedAllMessages.at(-1)?.parts;

      const chat = geminiModel.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: this.MAX_TOKENS,
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
          status: 'error',
          errorDetails: {
            code: error.code || 'UNKNOWN',
            message: error.message,
          },
        },
      };
    }
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
}
