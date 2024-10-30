import { Injectable, Inject } from '@nestjs/common';
import { AIProvider, AIService } from './ai.interface';
import * as fs from 'fs/promises';

const filePath = './src/data/users/';

export interface ChatResponseProps {
  prompt: string;
  model?: string;
  provider?: AIProvider;
  chatId: string;
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
  private chatsPath = './src/data/users/Claude/chats/';

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

  async getAvailableChats(): Promise<string[]> {
    try {
      await fs.access(this.chatsPath);
      const files = await fs.readdir(this.chatsPath);
      return files
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''));
    } catch (error) {
      await fs.mkdir(this.chatsPath, { recursive: true });
      return [];
    }
  }

  async getChatHistory(chatId: string) {
    const path = `${this.chatsPath}${chatId}.json`;
    try {
      const data = await fs.readFile(path, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        messages: [],
        lastUpdated: new Date().toISOString(),
        chatInfo: {
          user: 'Claude',
          chatName: chatId,
        },
      };
    }
  }

  private extractImagesFromText(text: string): {
    originalText: string;
    text: string;
    images: string[];
  } {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const images = text.match(urlRegex) || [];
    const cleanText = text.replace(urlRegex, '').trim();

    return {
      originalText: text,
      text: cleanText,
      images,
    };
  }

  async getAnswer({
    prompt,
    model,
    provider,
    chatId,
  }: ChatResponseProps): Promise<object> {
    this.chatName = chatId;
    const history = await this.getChatHistory(chatId);
    this.responses = history.messages;

    const selectedProvider = (provider ||
      this.services.defaultProvider) as AIProvider;
    const timestamp = new Date().toISOString();

    const { originalText, text, images } = this.extractImagesFromText(prompt);
    let formattedPrompt;

    if (images.length > 0) {
      formattedPrompt = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: originalText,
          },
          ...images.map((url) => ({
            type: 'image_url',
            image_url: { url },
          })),
        ],
      };
      this.responses = [];
    } else {
      formattedPrompt = {
        role: 'user',
        content: text,
      };
    }

    this.responses.push({
      role: 'user',
      content: formattedPrompt.content,
      metadata: {
        timestamp,
        provider: selectedProvider,
        model,
      },
    });

    const service = this.services[selectedProvider];
    if (!service) {
      throw new Error(`Provider ${selectedProvider} not supported`);
    }

    const message = await service.getAnswer(
      JSON.stringify(
        this.responses.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ),
      '',
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
      chatId: this.chatName,
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
