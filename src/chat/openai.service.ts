import OpenAI from 'openai';
import { AIService, AIProvider, AIResponse } from './ai.interface';
import { AIToolManager } from './skills/AIToolManager';
import { defaultTools } from './skills';
import { isImageUrl } from 'src/utils';

type ModelProps = 'gpt-4o-mini' | 'gpt-4o' | 'o1-mini' | 'o1-preview';

export class OpenAIService extends AIToolManager implements AIService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  private defaultModel: ModelProps = 'gpt-4o';
  private MAX_TOKENS = 4096;

  constructor() {
    super();
    defaultTools.forEach((tool) => this.registerTool(tool));
  }

  async getAnswer(
    prompt: string,
    model: ModelProps = this.defaultModel,
  ): Promise<AIResponse> {
    try {
      const formattedMessages = [];

      try {
        const parsedPrompt = JSON.parse(prompt);
        formattedMessages.push(
          ...parsedPrompt.map((msg) => ({
            role: msg.role,
            content: Array.isArray(msg.content)
              ? msg.content.map((item) => {
                  if (typeof item === 'string') return item;

                  // Si c'est une URL d'image, on la traite comme telle
                  if (
                    item.type === 'image_url' &&
                    isImageUrl(item.image_url.url)
                  ) {
                    return {
                      type: 'image_url',
                      image_url: {
                        url: item.image_url.url,
                      },
                    };
                  }

                  // Sinon, on la traite comme du texte
                  return {
                    type: 'text',
                    text:
                      item.type === 'image_url'
                        ? item.image_url.url
                        : item.text,
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
          msg.content.some(
            (item) => item.type === 'image_url' && item.image_url?.url,
          ),
      );

      const completion = await this.openai.chat.completions.create({
        messages: formattedMessages,
        model: hasImages ? 'gpt-4o' : model,
        temperature: 0.7,
        max_completion_tokens: this.MAX_TOKENS,
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
              role: 'tool' as const,
              content: JSON.stringify(result) || '[]',
              tool_call_id: toolCall.id,
            };
          }),
        );

        // Ajouter les résultats des outils dans l'ordre correct
        toolCalls.forEach((toolCall) => {
          const toolResult = toolResults.find(
            (result) => result.tool_call_id === toolCall.id,
          );
          if (toolResult) {
            formattedMessages.push(toolResult);
          }
        });

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
          status: 'error',
          errorDetails: {
            code: error.code || 'UNKNOWN',
            message: error.message,
          },
        },
      };
    }
  }
}
