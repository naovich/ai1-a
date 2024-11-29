import Anthropic from '@anthropic-ai/sdk';
import { AIService, AIProvider, AIResponse, AITool } from './ai.interface';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import { AIToolManager } from './skills/AIToolManager';
import { defaultTools } from './skills';
import { isImageUrl } from 'src/utils';
export class AnthropicService extends AIToolManager implements AIService {
  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  private defaultModel = 'claude-3-5-sonnet-20241022';
  private MAX_TOKENS = 4096;
  private TEMPERATURE = 0.7;

  constructor() {
    super();
    defaultTools.forEach((tool) => this.registerTool(tool));
  }

  /*protected getTools(): AITool[] {
    return Array.from(this.tools.values());
  }*/

  private convertToolToAnthropicFormat(tool: AITool) {
    const parameters = tool.getSchema().parameters || {};
    return {
      name: tool.name,
      description: tool.getSchema().description,
      input_schema: {
        type: 'object' as const,
        properties: parameters,
        required: Object.keys(parameters),
      },
    };
  }

  async getAnswer(
    prompt: string,
    model: string = this.defaultModel,
  ): Promise<AIResponse> {
    let messages;
    try {
      messages = JSON.parse(prompt);
    } catch {
      messages = [{ role: 'user', content: prompt }];
    }

    const formattedAllMessages = await Promise.all(
      messages.map(async (msg) => ({
        role: msg.role,
        content: await this.formatMessageContent(msg.content),
      })),
    );

    const systemMessage = formattedAllMessages.at(0)?.content[0]?.text ?? '';
    const history = formattedAllMessages.slice(1);

    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: this.MAX_TOKENS,
        temperature: this.TEMPERATURE,
        system: systemMessage,
        messages: history,
        tools: this.getTools().map((tool) => ({
          name: tool.getSchema().function.name,
          description: tool.getSchema().function.description,
          input_schema: {
            type: 'object',
            properties: tool.getSchema().function.parameters.properties,
            required: tool.getSchema().function.parameters.required,
          },
        })),
        tool_choice: { type: 'auto' },
      });

      if (response.content.some((item) => item.type === 'tool_use')) {
        const toolResults = await Promise.all(
          response.content.map(async (item) => {
            if (item.type === 'tool_use') {
              const result = await this.executeTool(item.name, item.input);
              return {
                tool_call_id: item.id,
                content: JSON.stringify(result),
                tool_name: item.name,
              };
            }
            return null;
          }),
        ).then((results) => results.filter(Boolean));

        const finalResponse = await this.anthropic.messages.create({
          model: model,
          max_tokens: this.MAX_TOKENS,
          temperature: this.TEMPERATURE,
          system: systemMessage,
          messages: [
            ...history,
            { role: 'assistant', content: response.content },
            {
              role: 'user',
              content: toolResults.map((result) => ({
                type: 'tool_result',
                tool_use_id: result.tool_call_id,
                content: result.content,
              })),
            },
          ],
          tools: this.getTools().map((tool) =>
            this.convertToolToAnthropicFormat(tool),
          ),
          tool_choice: { type: 'auto' },
        });

        return {
          role: 'assistant',
          content: finalResponse.content
            .filter((item) => item.type === 'text')
            .map((item) => (item.type === 'text' ? item.text : ''))
            .join(' '),
          provider: 'anthropic' as AIProvider,
          metadata: {
            timestamp: new Date().toISOString(),
            model: finalResponse.model,
            tokens: {
              prompt: finalResponse.usage.input_tokens,
              completion: finalResponse.usage.output_tokens,
              total:
                finalResponse.usage.input_tokens +
                finalResponse.usage.output_tokens,
            },
            status: 'success',
            messageId: finalResponse.id,
            stopReason: finalResponse.stop_reason,
          },
        };
      }

      const assistantContent = await Promise.all(
        response.content.map(async (item) => {
          if (item.type === 'text') {
            return item.text;
          } else if (item.type === 'tool_use') {
            const toolResult = await this.executeTool(item.name, item.input);
            return `[Résultat ${item.name}: ${toolResult}]`;
          }
          return '';
        }),
      );

      return {
        role: 'assistant',
        content: assistantContent.join(' '),
        provider: 'anthropic' as AIProvider,
        metadata: {
          timestamp: new Date().toISOString(),
          model: response.model,
          tokens: {
            prompt: response.usage.input_tokens,
            completion: response.usage.output_tokens,
            total: response.usage.input_tokens + response.usage.output_tokens,
          },
          status: 'success',
          messageId: response.id,
          stopReason: response.stop_reason,
        },
      };
    } catch (error) {
      console.error('Anthropic error:', error);
      return {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue.',
        provider: 'anthropic',
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

  private async formatMessageContent(content: any): Promise<any[]> {
    function isValidBase64(str: string): boolean {
      try {
        return (
          Buffer.from(str, 'base64').toString('base64') ===
          str.replace(/\s/g, '')
        );
      } catch (err) {
        return false;
      }
    }
    if (Array.isArray(content)) {
      const formattedContent = [];

      for (const item of content) {
        if (item.type === 'text') {
          formattedContent.push({
            type: 'text',
            text: item.text,
          });
        } else if (
          item.type === 'image_url' &&
          isImageUrl(item.image_url.url)
        ) {
          try {
            let imageData: string;
            let mediaType: string;

            if (item.image_url.url.startsWith('data:')) {
              const dataUrlRegex = /^data:(.+?);base64,(.+)$/;
              const matches = item.image_url.url.match(dataUrlRegex);

              if (matches && matches.length === 3) {
                mediaType = matches[1];
                imageData = matches[2];

                imageData = decodeURIComponent(imageData);

                imageData = imageData.replace(/\s/g, '');

                if (!isValidBase64(imageData)) {
                  throw new Error('Invalid base64 image data');
                }
              } else {
                throw new Error('Invalid data URL format');
              }
            } else {
              const response = await fetch(item.image_url.url);
              const arrayBuffer = await response.arrayBuffer();
              mediaType =
                response.headers.get('content-type') ||
                'application/octet-stream';
              imageData = Buffer.from(arrayBuffer).toString('base64');
            }
            formattedContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData,
              },
            });
          } catch (error) {
            console.error('Error processing image:', error);
            formattedContent.push({
              type: 'text',
              text: `[Image non chargée: ${item.image_url.url}]`,
            });
          }
        }
      }
      return formattedContent;
    } else {
      return [{ type: 'text', text: content }];
    }
  }
}
