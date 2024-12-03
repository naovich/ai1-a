import { AIService, AIProvider, AIResponse } from './ai.interface';
import { AIToolManager } from './skills/AIToolManager';
//import { defaultTools } from './skills';

type ModelProps =
  | 'llama-3.1-sonar-small-128k-online'
  | 'llama-3.1-sonar-large-128k-online'
  | 'llama-3.1-sonar-huge-128k-online';

export class PerplexityService extends AIToolManager implements AIService {
  private apiKey = process.env.PERPLEXITY_API_KEY;
  private defaultModel: ModelProps = 'llama-3.1-sonar-large-128k-online';
  private MAX_TOKENS = 4096;

  constructor() {
    super();
    // defaultTools.forEach((tool) => this.registerTool(tool));
  }

  async getAnswer(
    prompt: string,
    model: ModelProps = this.defaultModel,
  ): Promise<AIResponse> {
    try {
      const formattedMessages = [];
      console.log(`📝 Requête vers perplexity...`);

      try {
        const parsedPrompt = JSON.parse(prompt);
        formattedMessages.push(
          ...parsedPrompt.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        );
      } catch {
        formattedMessages.push({ role: 'user', content: prompt });
      }

      const response = await fetch(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: formattedMessages,
            max_tokens: this.MAX_TOKENS,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const completion = await response.json();
      console.log(
        `🔍 Réponse de perplexity: ${JSON.stringify(completion, null, 2)}`,
      );

      return {
        role: completion.choices[0].message.role,
        content:
          completion.choices[0].message.content +
          '\n\n' +
          (completion.citations
            ? '**Sources:**\n' +
              completion.citations
                .map(
                  (citation, index) =>
                    `- \\[${index + 1}\\] [${new URL(citation).hostname}](${citation})`,
                )
                .join('\n')
            : ''),
        provider: 'perplexity' as AIProvider,
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
      console.error('Perplexity error:', error);
      return {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue.',
        provider: 'perplexity',
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
