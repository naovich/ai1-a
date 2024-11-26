import OpenAI from 'openai';
import { AIService, AIProvider, AIResponse } from './ai.interface';
import { AIToolManager } from './skills/AIToolManager';
import { defaultTools } from './skills';

type ModelProps = 'gpt-4o-mini' | 'gpt-4o' | 'o1-mini' | 'o1-preview';

export class OpenAIService extends AIToolManager implements AIService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  private defaultModel: ModelProps = 'gpt-4o';

  constructor() {
    super();
    defaultTools.forEach((tool) => this.registerTool(tool));
  }

  async getAnswer(
    prompt: string,
    systemContent: string = '',
    model: ModelProps = this.defaultModel,
  ): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const formattedMessages = [];
      if (systemContent) {
        formattedMessages.push({ role: 'system', content: systemContent });
      }

      try {
        const parsedPrompt = JSON.parse(prompt);
        formattedMessages.push(
          ...parsedPrompt.map((msg) => ({
            role: msg.role,
            content: Array.isArray(msg.content)
              ? msg.content.map((item) => {
                  if (typeof item === 'string') return item;
                  return {
                    type: item.type,
                    ...(item.type === 'text' ? { text: item.text } : {}),
                    ...(item.type === 'image_url'
                      ? {
                          image_url: {
                            url: item.image_url.url,
                          },
                        }
                      : {}),
                  };
                })
              : msg.content,
          })),
        );
      } catch {
        formattedMessages.push({ role: 'user', content: prompt });
      }

      const hasImages = formattedMessages.some(
        (msg) =>
          Array.isArray(msg.content) &&
          msg.content.some((item) => item.type === 'image_url'),
      );

      const completion = await this.openai.chat.completions.create({
        messages: formattedMessages,
        model: hasImages ? 'gpt-4o' : model,
        temperature: 0.7,
        max_completion_tokens: 1000,
        tools: this.getToolSchemas(),
        tool_choice: 'auto',
      });

      if (completion.choices[0].message.tool_calls) {
        const toolCalls = completion.choices[0].message.tool_calls;
        formattedMessages.push(completion.choices[0].message);

        // Exécuter tous les tool calls en parallèle
        const toolResults = await Promise.all(
          toolCalls.map(async (toolCall) => {
            const result = await this.executeTool(
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments),
            );
            return {
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            };
          }),
        );

        formattedMessages.push(...toolResults);

        // Faire un deuxième appel pour obtenir la réponse finale
        const secondCompletion = await this.openai.chat.completions.create({
          messages: formattedMessages,
          model: hasImages ? 'gpt-4o' : model,
          temperature: 0.7,
          max_completion_tokens: 1000,
        });

        completion.choices[0].message = secondCompletion.choices[0].message;
      }

      return {
        role: completion.choices[0].message.role,
        content: completion.choices[0].message.content || '',
        provider: 'openai' as AIProvider,
        metadata: {
          timestamp: new Date().toISOString(),
          model: completion.model,
          responseTime: Date.now() - startTime,
          tokens: {
            prompt: completion.usage?.prompt_tokens || 0,
            completion: completion.usage?.completion_tokens || 0,
            total: completion.usage?.total_tokens || 0,
          },
          status: 'success',
          messageId: completion.id,
          stopReason: completion.choices[0].finish_reason,
        },
      };
    } catch (error) {
      console.error('OpenAI error:', error);
      return {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue.',
        provider: 'openai',
        metadata: {
          timestamp: new Date().toISOString(),
          model: model,
          responseTime: Date.now() - startTime,
          status: 'error',
          errorDetails: {
            code: error.code || 'UNKNOWN',
            message: error.message,
          },
        },
      };
    }
  }

  async generateSpeech(text: string): Promise<Buffer> {
    const mp3 = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    return Buffer.from(await mp3.arrayBuffer());
  }
}
