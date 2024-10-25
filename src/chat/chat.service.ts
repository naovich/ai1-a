import { Injectable, Inject } from '@nestjs/common';
import { AIService } from './ai.interface';
import * as fs from 'fs/promises';

const filePath = './src/data/users/';

type AIProvider = 'anthropic' | 'openai';

export interface ChatResponseProps {
  system?: {
    content?: string;
  };
  prompt: string;
  model?: string;
  provider?: AIProvider;
}

interface MessageMetadata {
  timestamp: string;
  provider?: AIProvider;
  model?: string;
}

interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
  metadata?: MessageMetadata;
}

interface Services {
  anthropic: AIService;
  openai: AIService;
  defaultProvider: AIProvider;
}

@Injectable()
export class ChatService {
  private responses: ChatMessage[] = [];
  private chatName: string;
  private user: string;
  private speechFile: string;

  constructor(@Inject('AIService') private services: Services) {
    this.user = 'Claude';
    this.chatName = 'chat_1';
    this.speechFile = './temp/audio/speech.mp3';
    this.initResponses();
  }

  private async initResponses(): Promise<void> {
    const path = `${filePath}${this.user}/chats/${this.chatName}.json`;
    try {
      await fs.access(path);
      const data = await fs.readFile(path, 'utf8');
      const parsedData = JSON.parse(data);
      this.responses = parsedData.messages || [];
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
    provider,
  }: ChatResponseProps): Promise<object> {
    const selectedProvider = (provider ||
      this.services.defaultProvider) as AIProvider;
    const timestamp = new Date().toISOString();
    console.log('Using AI Provider:', selectedProvider);

    this.responses.push({
      role: 'user',
      content: prompt,
      metadata: {
        timestamp,
        provider: selectedProvider,
      },
    });

    const service = this.services[selectedProvider];
    if (!service) {
      throw new Error(`Provider ${selectedProvider} not supported`);
    }

    const systemMessage = system?.content
      ? {
          role: 'system' as const,
          content: `Context: Current time is ${new Date().toLocaleString()}. Previous messages include their timestamps. Please consider this temporal context in your response.\n\n${system.content}`,
          metadata: {
            timestamp,
            provider: selectedProvider,
            model,
          },
        }
      : null;

    const messagesToSend = [
      ...(systemMessage ? [systemMessage] : []),
      ...this.responses,
    ];

    const message = await service.getAnswer(
      JSON.stringify(messagesToSend),
      systemMessage?.content,
      model,
    );

    this.responses.push({
      role: 'assistant',
      content: message.content,
      metadata: {
        timestamp: new Date().toISOString(),
        provider: selectedProvider,
        model: message.model || model,
      },
    });

    await this.saveHistory();
    return message;
  }

  async generateSpeech(text: string): Promise<void> {
    const buffer = await this.services.openai.generateSpeech(text);
    await fs.writeFile(this.speechFile, buffer);
  }

  async generateChatSpeech(text: string): Promise<void> {
    const response: any = await this.getAnswer({
      prompt: text,
    });
    const buffer = await this.services.openai.generateSpeech(response.content);
    await fs.writeFile(this.speechFile, buffer);
  }

  async saveHistory(): Promise<void> {
    const path = `${filePath}${this.user}/chats/`;
    const fullPath = `${path}${this.chatName}.json`;

    try {
      await fs.mkdir(path, { recursive: true });
      const historyData = {
        messages: this.responses,
        lastUpdated: new Date().toISOString(),
        chatInfo: {
          user: this.user,
          chatName: this.chatName,
        },
      };
      await fs.writeFile(fullPath, JSON.stringify(historyData, null, 2));
      console.log('History saved successfully!');
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }
}
