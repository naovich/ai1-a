import OpenAI from 'openai';
import { AIService, AIProvider, AIResponse } from './ai.interface';

type ModelProps =
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-instruct'
  | 'gpt-4-vision-preview'
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'o1-mini'
  | 'o1-preview';

export class OpenAIService implements AIService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  private defaultModel: ModelProps = 'gpt-4o';

  async getAnswer(
    prompt: string,
    systemContent: string = '',
    model: ModelProps = this.defaultModel,
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: prompt },
        ],
        model: model,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return {
        role: completion.choices[0].message.role,
        content: completion.choices[0].message.content || '',
        provider: 'openai' as AIProvider,
        metadata: {
          timestamp: new Date().toISOString(),
          model: completion.model,
          responseTime: Date.now() - startTime,
          tokens: {
            prompt: completion.usage?.prompt_tokens || 0,
            completion: completion.usage?.completion_tokens || 0,
            total: completion.usage?.total_tokens || 0,
          },
          status: 'success',
          messageId: completion.id,
          stopReason: completion.choices[0].finish_reason,
        },
      };
    } catch (error) {
      console.error('OpenAI error:', error);
      return {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue.',
        provider: 'openai',
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
