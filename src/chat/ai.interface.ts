export interface AIService {
  getAnswer(
    prompt: string,
    systemContent?: string,
    model?: string,
  ): Promise<{ role: string; content: string }>;
  generateSpeech(text: string): Promise<Buffer>;
}
