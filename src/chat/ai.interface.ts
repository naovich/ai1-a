export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface MessageMetadata {
  timestamp: string;
  model?: string;
  responseTime?: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  status?: 'success' | 'error';
  messageId?: string;
  stopReason?: string;
  errorDetails?: {
    code: string;
    message: string;
  };
}

export interface AIResponse {
  role: string;
  content: string;
  provider: AIProvider;
  metadata?: MessageMetadata;
  model?: string;
}

export interface AIService {
  getAnswer(
    prompt: string,
    systemContent?: string,
    model?: string,
  ): Promise<AIResponse>;
  generateSpeech(text: string): Promise<Buffer>;
}

export interface ChatContent {
  type: 'text' | 'image';
  text?: string;
  image_url?: string;
}

export interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string | ChatContent[];
}
