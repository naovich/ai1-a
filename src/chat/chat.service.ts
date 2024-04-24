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
  speech?: boolean;
}

//dall-e-3 ts-1 tts-1-hd whisper-1

@Injectable()
export class ChatService {
  private responses: { role: 'assistant' | 'user'; content: string }[] = [];
  private chatName: string;
  private user: string;
  private speechFile: string;

  constructor() {
    this.user = 'admin';
    this.chatName = 'chat_1';
    this.initResponses();
    this.speechFile = './temp/audio/speech.mp3';
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

  async deleteChat(user: string, chatName: string): Promise<void> {
    this.user = user;
    this.chatName = chatName;
    const path = `${filePath}${this.user}/chats/${this.chatName}.json`;

    try {
      await fs.unlink(path);
      console.log('Chat deleted successfully!');
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
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
  async generateSpeech(text: string): Promise<void> {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    console.log(text);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(this.speechFile, buffer);
  }

  async generateChatSpeech(text: string): Promise<void> {
    const response: any = await this.getAnswer({
      prompt: text,
    });
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: response.content,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(this.speechFile, buffer);
  }

  async saveHistory(): Promise<void> {
    const path = `${filePath}${this.user}/chats/`;
    const fullPath = `${path}${this.chatName}.json`;

    try {
      await fs.mkdir(path, { recursive: true });
      const data = JSON.stringify(this.responses, null, 2);
      await fs.writeFile(fullPath, data);
      console.log('History saved successfully!');
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }
}
