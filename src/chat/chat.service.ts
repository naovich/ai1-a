import { Injectable } from '@nestjs/common';

import OpenAI from 'openai';
import { systemProfile } from './data';
import * as fs from 'fs/promises';

const openai = new OpenAI();
const filePath = './src/data/users/';

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
  private responses: { role: 'assistant' | 'user'; content: string }[] = [];
  private chatName: string;
  private user: string;

  constructor() {
    this.user = 'admin';
    this.chatName = 'chat_1';
    this.initResponses();
  }

  private async initResponses(): Promise<void> {
    const path = `${filePath}${this.user}/chats/${this.chatName}.json`;

    try {
      await fs.access(path);
      const data = await fs.readFile(path, 'utf8');
      this.responses = JSON.parse(data);
    } catch (error) {
      this.responses = [];
      await this.saveHistory();
    }
  }

  async startNewChat(user: string, chatName: string): Promise<void> {
    this.user = user;
    this.chatName = chatName;
    this.responses = [];
    await this.initResponses();
  }

  async changeChat(chatName: string): Promise<void> {
    this.chatName = chatName;
    this.responses = [];
    await this.initResponses();
  }

  async getAnswer({
    system,
    model = 'gpt-3.5-turbo',
    prompt,
  }: ChatResponseProps): Promise<object> {
    this.responses.push({ role: 'user', content: prompt });
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: system?.content ?? systemProfile[0].content,
        },
        ...this.responses,
      ],
      model: model,
    });
    this.responses.push(completion.choices[0].message);
    console.log(completion.choices[0]);
    this.saveHistory();
    return completion.choices[0].message;
  }

  async saveHistory(): Promise<void> {
    const path = `${filePath}${this.user}/chats/`;
    const fullPath = `${path}${this.chatName}.json`;

    try {
      await fs.mkdir(path, { recursive: true }); // Créer le répertoire s'il n'existe pas
      const data = JSON.stringify(this.responses, null, 2);
      await fs.writeFile(fullPath, data);
      console.log('History saved successfully!');
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }
}
