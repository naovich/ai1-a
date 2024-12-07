import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
//import { FunctionCallingMode } from '@google/generative-ai';
import { AIService, AIProvider, AIResponse, AITool } from './ai.interface';
import { AIToolManager } from './skills/AIToolManager';
import { defaultTools, SearchTool } from './skills';

type ModelProps = 'gemini-pro' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export class GeminiService extends AIToolManager implements AIService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  private defaultModel: ModelProps = 'gemini-1.5-pro';
  private MAX_TOKENS = 10000;

  constructor() {
    super();
    defaultTools.forEach((tool) => this.registerTool(tool));
  }

  private convertToolToGeminiFormat(tool: AITool) {
    const schema = tool.getSchema().function;
    return {
      name: schema.name,
      description: schema.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: Object.entries(schema.parameters.properties).reduce(
          (acc, [key, prop]: [string, any]) => ({
            ...acc,
            [key]: {
              type: this.convertToGeminiType(prop.type),
              description: prop.description,
              ...(prop.enum ? { enum: prop.enum } : {}),
            },
          }),
          {},
        ),
        required: schema.parameters.required,
      },
    };
  }

  private convertToGeminiType(type: string): SchemaType {
    const typeMap: Record<string, SchemaType> = {
      string: SchemaType.STRING,
      integer: SchemaType.INTEGER,
      boolean: SchemaType.BOOLEAN,
      object: SchemaType.OBJECT,
    };
    return typeMap[type.toLowerCase()] || SchemaType.STRING;
  }

  async getAnswer(
    prompt: string,
    model: string = this.defaultModel,
    searchOn: boolean = true,
  ): Promise<AIResponse> {
    try {
      const generativeModel = this.genAI.getGenerativeModel({
        model,
        tools: [
          {
            functionDeclarations: this.getTools()
              .filter((tool) => searchOn || !(tool instanceof SearchTool))
              .map((tool) => this.convertToolToGeminiFormat(tool)),
          },
        ],
        /*toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingMode.ANY,
            allowedFunctionNames: this.getTools().map(
              (tool) => tool.getSchema().function.name,
            ),
          },
        },*/
      });

      const formattedMessages: any[] = JSON.parse(prompt);

      const formattedAllMessages = await Promise.all(
        formattedMessages.map(async (msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: await this.formatMessageContent(msg.content),
        })),
      );

      const history = formattedAllMessages.slice(0, -1).filter(Boolean);
      const formattedLastMessage = formattedAllMessages.at(-1)?.parts;

      const chat = generativeModel.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: this.MAX_TOKENS,
        },
      });

      const result = await chat.sendMessage(formattedLastMessage);
      const response = await result.response;

      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const toolResults = await Promise.all(
          functionCalls.map(async (call) => {
            const result = await this.executeTool(call.name, call.args);
            return {
              tool_call_id: call.name,
              content: JSON.stringify(result),
              tool_name: call.name,
            };
          }),
        );

        const finalResponse = await chat.sendMessage([
          {
            text: JSON.stringify(
              toolResults.map((r) => ({
                type: 'tool_result',
                tool_use_id: r.tool_call_id,
                content: r.content,
              })),
            ),
          },
        ]);

        return {
          role: 'assistant',
          content: finalResponse.response.text(),
          provider: 'gemini' as AIProvider,
          metadata: {
            timestamp: new Date().toISOString(),
            model: model,
            status: 'success',
          },
        };
      }

      return {
        role: 'assistant',
        content: response.text(),
        provider: 'gemini' as AIProvider,
        metadata: {
          timestamp: new Date().toISOString(),
          model: model,
          status: 'success',
        },
      };
    } catch (error) {
      console.error('Gemini error:', error);
      return {
        role: 'assistant',
        content:
          'Désolé, une erreur est survenue lors du traitement de votre demande.',
        provider: 'gemini',
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
    if (Array.isArray(content)) {
      const formattedParts = [];

      for (const item of content) {
        if (item.type === 'text') {
          formattedParts.push({ text: item.text });
        } else if (item.type === 'image_url') {
          try {
            let imageData: string;
            let mimeType: string;

            if (item.image_url.url.startsWith('data:')) {
              const [mimeInfo, data] = item.image_url.url.split(',');
              mimeType = mimeInfo.split(':')[1].split(';')[0];
              imageData = data;
            } else {
              const response = await fetch(item.image_url.url);
              const arrayBuffer = await response.arrayBuffer();
              const contentType =
                response.headers.get('content-type') || 'image/jpeg';
              imageData = Buffer.from(arrayBuffer).toString('base64');
              mimeType = contentType;
            }

            formattedParts.push({
              inlineData: {
                data: imageData,
                mimeType: mimeType,
              },
            });
          } catch (error) {
            console.error('Error processing image:', error);
            formattedParts.push({
              text: `[Image non chargée: ${item.image_url.url}]`,
            });
          }
        }
      }
      return formattedParts;
    }

    return [{ text: content }];
  }
}
