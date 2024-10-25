import Anthropic from '@anthropic-ai/sdk';
import { AIService, AIProvider, AIResponse } from './ai.interface';
import OpenAI from 'openai';

export class AnthropicService implements AIService {
  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  private defaultModel = 'claude-3-5-sonnet-20241022';

  async getAnswer(
    prompt: string,
    systemContent: string = '',
    model: string = this.defaultModel,
  ): Promise<AIResponse> {
    const startTime = Date.now();
    let messages;

    try {
      messages = JSON.parse(prompt);
    } catch {
      messages = [{ role: 'user', content: prompt }];
    }

    // Convertit les messages pour Anthropic en retirant les metadata
    const anthropicMessages = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        messages: anthropicMessages,
        system: systemContent,
      });

      return {
        role: 'assistant',
        content:
          response.content[0].type === 'text' ? response.content[0].text : '',
        provider: 'anthropic' as AIProvider,
        metadata: {
          timestamp: new Date().toISOString(),
          model: response.model,
          responseTime: Date.now() - startTime,
          tokens: {
            prompt: response.usage.input_tokens,
            completion: response.usage.output_tokens,
            total: response.usage.input_tokens + response.usage.output_tokens,
          },
          status: 'success',
          messageId: response.id,
          stopReason: response.stop_reason,
        },
      };
    } catch (error) {
      console.error('Anthropic error:', error);
      return {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue.',
        provider: 'anthropic',
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
