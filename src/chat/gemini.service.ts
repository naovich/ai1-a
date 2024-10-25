import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService, AIProvider, AIResponse } from './ai.interface';
import OpenAI from 'openai';

type ModelProps = 'gemini-pro' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export class GeminiService implements AIService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  private defaultModel: ModelProps = 'gemini-pro';

  async getAnswer(
    prompt: string,
    systemContent: string = '',
    model: ModelProps = this.defaultModel,
  ): Promise<AIResponse> {
    const startTime = Date.now();
    let messages;

    try {
      messages = JSON.parse(prompt);
    } catch {
      messages = [{ role: 'user', content: prompt }];
    }

    try {
      const geminiModel = this.genAI.getGenerativeModel({ model: model });

      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chat = geminiModel.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const lastMessage = systemContent
        ? `${systemContent}\n\n${messages[messages.length - 1].content}`
        : messages[messages.length - 1].content;

      const result = await chat.sendMessage(lastMessage);

      const response = await result.response;

      return {
        role: 'assistant',
        content: response.text(),
        provider: 'gemini' as AIProvider,
        metadata: {
          timestamp: new Date().toISOString(),
          model: model,
          responseTime: Date.now() - startTime,
          tokens: {
            prompt: 0,
            completion: 0,
            total: 0,
          },
          status: 'success',
          messageId:
            response.promptFeedback?.safetyRatings?.[0]?.probability || '',
          stopReason: 'stop',
        },
      };
    } catch (error) {
      console.error('Gemini error:', error);
      return {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue.',
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
}
