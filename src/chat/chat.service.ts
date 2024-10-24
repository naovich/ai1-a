import { Injectable, Inject } from '@nestjs/common';
import { AIService } from './ai.interface';
import * as fs from 'fs/promises';

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
  model?: string;
  speech?: boolean;
}

@Injectable()
export class ChatService {
  private responses: { role: 'assistant' | 'user'; content: string }[] = [];
  private chatName: string;
  private user: string;
  private speechFile: string;

  constructor(@Inject('AIService') private aiService: AIService) {
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
    model,
    prompt,
  }: ChatResponseProps): Promise<object> {
    this.responses.push({ role: 'user', content: prompt });

    const messagesToSend = [
      { role: 'system', content: system?.content || '' },
      ...this.responses,
    ];

    const message = await this.aiService.getAnswer(
      JSON.stringify(messagesToSend),
      model,
    );

    this.responses.push({ role: 'assistant', content: message.content });
    console.log(message);

    this.saveHistory();

    return message;
  }

  async generateSpeech(text: string): Promise<void> {
    const buffer = await this.aiService.generateSpeech(text);
    await fs.writeFile(this.speechFile, buffer);
  }

  async generateChatSpeech(text: string): Promise<void> {
    const response: any = await this.getAnswer({
      prompt: text,
    });
    const buffer = await this.aiService.generateSpeech(response.content);
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
