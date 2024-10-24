import OpenAI from 'openai';
import { AIService } from './ai.interface';

type ModelProps =
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-instruct'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4-32k'
  | 'gpt-4-vision-preview'
  | 'gpt-4o-mini'
  | 'gpt-4o';

export class OpenAIService implements AIService {
  private openai = new OpenAI();
  private defaultModel: ModelProps = 'gpt-3.5-turbo';

  async getAnswer(
    prompt: string,
    systemContent: string = '',
    model: ModelProps = this.defaultModel,
  ): Promise<{ role: string; content: string }> {
    const completion = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt },
      ],
      model: model,
    });
    return completion.choices[0].message;
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
