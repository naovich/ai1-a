import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

const openai = new OpenAI();

@Injectable()
export class CommandService {
  async interpretCommand(command: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that classifies commands. Respond with "1" for commands related to turning on a light, "2" for commands related to turning on the TV, and "0" for any other commands. Here are some examples:
          
          - "Allume la lumière" -> "1"
          - "Turn on the light" -> "1"
          - "Allume la télé" -> "2"
          - "Turn on the TV" -> "2"
          - "Donne moi la météo" -> "0"
          - "What's the weather?" -> "0"`,
          },
          {
            role: 'user',
            content: `${command}`,
          },
        ],
        max_tokens: 5, // Ajusté pour capturer une réponse courte mais avec un peu plus de flexibilité
        temperature: 0,
      });

      console.log('API Response:', completion); // Log complet de la réponse de l'API

      const classification = completion.choices[0].message.content
        .trim()
        .replace(/["']/g, '');
      console.log('Classification:', classification); // Log de la classification extraite

      return classification;
    } catch (error) {
      console.error('Error interpreting command:', error);
      throw new Error('Error interpreting command');
    }
  }
}
