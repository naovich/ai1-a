import Anthropic from '@anthropic-ai/sdk';
import { AIService, AIProvider, AIResponse } from './ai.interface';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

export class AnthropicService implements AIService {
  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  private defaultModel = 'claude-3-5-sonnet-20241022';

  async getAnswer(
    prompt: string,
    systemContent: string = '',
    model: string = this.defaultModel,
  ): Promise<AIResponse> {
    const startTime = Date.now();
    let messages;

    try {
      messages = JSON.parse(prompt);
    } catch {
      messages = [{ role: 'user', content: prompt }];
    }

    // Process messages to format content appropriately
    const anthropicMessages = await Promise.all(
      messages.map(async (msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: await this.formatMessageContent(msg.content),
      })),
    );

    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        messages: anthropicMessages,
        system: systemContent,
      });

      // Process the response to extract the assistant's reply
      const assistantContent = response.content
        .map((item) => {
          if (item.type === 'text') {
            return item.text;
          } else if (item.type === 'tool_use') {
            // Handle tool use responses
            return '[Tool Use]';
          } else {
            return '';
          }
        })
        .join(' ');

      return {
        role: 'assistant',
        content: assistantContent,
        provider: 'anthropic' as AIProvider,
        metadata: {
          timestamp: new Date().toISOString(),
          model: response.model,
          responseTime: Date.now() - startTime,
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
  private async formatMessageContent(content: any): Promise<any[]> {
    // Helper function to validate base64 strings
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
        } else if (item.type === 'image_url') {
          try {
            let imageData: string;
            let mediaType: string;

            if (item.image_url.url.startsWith('data:')) {
              // Extract media type and base64 data from data URL
              const dataUrlRegex = /^data:(.+?);base64,(.+)$/;
              const matches = item.image_url.url.match(dataUrlRegex);

              if (matches && matches.length === 3) {
                mediaType = matches[1];
                imageData = matches[2];

                // Decode URL-encoded base64 data
                imageData = decodeURIComponent(imageData);

                // Remove any whitespace or line breaks
                imageData = imageData.replace(/\s/g, '');

                // Validate base64 data
                if (!isValidBase64(imageData)) {
                  throw new Error('Invalid base64 image data');
                }
              } else {
                throw new Error('Invalid data URL format');
              }
            } else {
              // Fetch image from URL
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

  async generateSpeech(text: string): Promise<Buffer> {
    const mp3 = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    return Buffer.from(await mp3.arrayBuffer());
  }
}
