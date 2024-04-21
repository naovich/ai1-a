import { Injectable } from '@nestjs/common';

import OpenAI from 'openai';
import { systemProfile } from './data';
const openai = new OpenAI();
const responses: { role: 'assistant' | 'user'; content: string }[] = [];

export interface ChatResponseProps {
  system?: {
    content?: string;
  };
  history?: {
    role: 'system' | 'user';
    content: string;
  }[];
  prompt: string;
  model?:
    | 'gpt-3.5-turbo'
    | 'gpt-3.5-turbo-instruct'
    | 'gpt-4'
    | 'gpt-4-turbo'
    | 'gpt-4-32k'
    | 'gpt-4-vision-preview';
}

//dall-e-3 ts-1 tts-1-hd whisper-1

@Injectable()
export class ChatService {
  async getAnswer({
    system,
    model = 'gpt-3.5-turbo',
    prompt,
  }: ChatResponseProps): Promise<object> {
    responses.push({ role: 'user', content: prompt });
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: system?.content ?? systemProfile[0].content,
        },
        ...responses,
      ],
      model: model,
    });
    responses.push(completion.choices[0].message);
    // console.log(responses);
    console.log(completion.choices[0]);
    return completion.choices[0].message;
  }
}
