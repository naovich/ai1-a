import { Injectable, Inject } from '@nestjs/common';
import { AIProvider, AIService } from './ai.interface';
import * as fs from 'fs/promises';
import { systemProfile } from './chat.data';
import { getMimeTypeFromDataUrl } from 'src/utils';

const filePath = './src/data/users/';

export interface ChatResponseProps {
  prompt: string;
  model?: string;
  provider?: AIProvider;
  chatId: string;
  systemProfileId?: string;
  refresh?: boolean;
  searchOn?: boolean;
}

interface MessageMetadata {
  timestamp: string;
  provider?: AIProvider;
  model?: string;
}

interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string | any[];
  metadata?: MessageMetadata;
}

interface Services {
  anthropic: AIService;
  openai: AIService;
  gemini: AIService;
  defaultProvider: AIProvider;
}

interface ImageData {
  type: 'url' | 'file';
  content: string;
  mimeType?: string;
}

@Injectable()
export class ChatService {
  private responses: ChatMessage[] = [];
  private chatName: string;
  private user: string;
  private chatsPath = './src/data/users/admin/chats/';
  private systemProfile: string = '';

  constructor(@Inject('AIService') private services: Services) {
    this.user = 'admin';
    this.chatName = 'chat_1';
    this.systemProfile = 'AGI';
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

  async startNewChat(
    user: string,
    chatName: string,
    profileId: string = 'AGI',
  ): Promise<void> {
    this.user = user;
    this.chatName = chatName;
    this.responses = [];
    this.setSystemProfile(profileId);
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

  async getChatProfiles(): Promise<string[]> {
    return systemProfile.map((p) => p.id);
  }

  async getChatHistory(chatId: string) {
    const path = `${this.chatsPath}${chatId}.json`;
    try {
      const data = await fs.readFile(path, 'utf8');
      const history = JSON.parse(data);

      if (
        history.messages.length > 0 &&
        history.messages[0].role === 'system'
      ) {
        history.messages = history.messages.slice(1);
      }

      return history;
    } catch (error) {
      return {
        messages: [],
        lastUpdated: new Date().toISOString(),
        chatInfo: {
          user: 'admin',
          chatName: chatId,
        },
      };
    }
  }

  private extractImagesFromText(content: string | any[]): {
    originalText: string;
    text: string;
    images: ImageData[];
  } {
    if (Array.isArray(content)) {
      const textContent =
        content.find((item) => item.type === 'text')?.text || '';
      const images = content
        .filter((item) => item.type === 'image_url')
        .map((item) => ({
          type: item.image_url.url.startsWith('data:')
            ? 'file'
            : ('url' as 'url' | 'file'),
          mimeType: item.image_url.url.startsWith('data:')
            ? getMimeTypeFromDataUrl(item.image_url.url)
            : null,
          content: item.image_url.url.startsWith('data:')
            ? item.image_url.url.split(',')[1]
            : item.image_url.url,
        }));

      return {
        originalText: textContent,
        text: textContent,
        images,
      };
    }

    const text = content as string;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const images = (text.match(urlRegex) || []).map((url) => ({
      type: 'url' as const,
      content: url,
    }));
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
    systemProfileId,
    refresh,
    searchOn,
  }: ChatResponseProps): Promise<object> {
    this.chatName = chatId;
    const history = await this.getChatHistory(chatId);
    this.responses = history.messages;

    console.log('*********** DEBUT ***************');

    if (refresh && this.responses.length > 0) {
      const lastMessage = this.responses[this.responses.length - 1];
      if (lastMessage.role === 'assistant') {
        this.responses.pop();
      }
    }

    if (systemProfileId) {
      this.setSystemProfile(systemProfileId);
    }

    if (systemProfileId) {
      const systemMessage = {
        role: 'system' as const,
        content: this.systemProfile,
        metadata: {
          timestamp: new Date().toISOString(),
          provider: provider || this.services.defaultProvider,
          model,
        },
      };

      if (this.responses.length > 0 && this.responses[0].role === 'system') {
        this.responses[0] = systemMessage; // Remplace le message système existant
      } else {
        this.responses.unshift(systemMessage); // Ajoute le message système au début
      }
    }

    const selectedProvider = (provider ||
      this.services.defaultProvider) as AIProvider;
    const timestamp = new Date().toISOString();

    if (!refresh) {
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
            ...images.map((img) => ({
              type: 'image_url',
              image_url: {
                url:
                  img.type === 'file'
                    ? `data:${img.mimeType};base64,${img.content}`
                    : img.content,
              },
            })),
          ],
        };
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
    }

    const service = this.services[selectedProvider];
    if (!service) {
      throw new Error(`Provider ${selectedProvider} not supported`);
    }

    // Préparer les messages pour le fournisseur sous forme de chaîne JSON
    const messagesForProvider = JSON.stringify(
      this.responses.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    );

    const message = await service.getAnswer(
      messagesForProvider,
      model,
      searchOn,
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
      console.log('💾 Historique sauvegardé avec succès !');
    } catch (error) {
      console.error('Failed to save history:', error);
    }
    console.log('*********** FIN ***************');
  }

  setSystemProfile(profileId: string): void {
    const profile = systemProfile.find((p) => p.id === profileId);
    if (profile) {
      this.systemProfile = profile.content;
    }
  }
}
