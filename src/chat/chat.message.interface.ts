export type ChatContent =
  | string
  | {
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }[];

export interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string | ChatContent[];
  metadata?: {
    timestamp: string;
    provider?: string;
    model?: string;
  };
}
