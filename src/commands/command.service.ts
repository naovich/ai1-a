import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

const openai = new OpenAI();

@Injectable()
export class CommandService {
  async interpretCommand(
    command: string,
  ): Promise<{ command: string; response: string }> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that processes commands or answers questions. If the command is related to turning on a light, respond with {"command": "1", "response": "ok j'allume la lumière"}.
            If the command is related to turning on the TV, respond with {"command": "2", "response": "ok j'allume la télé"}.
            For any other command, provide a normal response to the query and return it as {"command": "0", "response": "<your normal response here>"}.
            If there is a command and a question in the same sentence, respond to the command first and then provide an answer to the question in the same JSON response.
            
            Here are some examples:
          
            - "Allume la lumière" -> {"command": "1", "response": "ok j'allume la lumière"}
            - "Turn on the light" -> {"command": "1", "response": "Ok right away, I'll turn on the light!"}
            - "Allume la télé" -> {"command": "2", "response": "J'allume la télé!"}
            - "Turn on the TV" -> {"command": "2", "response": "OK"}
            - "Donne moi la météo" -> {"command": "0", "response": "Je ne suis pas capable de donner la météo pour le moment."}
            - "What's the weather?" -> {"command": "0", "response": "I'm not able to provide the weather at the moment."}
            - "Quelle est la capitale de la France" -> {"command": "0", "response": "La capitale de la France est Paris."}
            - "Je suis allé à la montagne, plus je montais et plus il faisait froid, pourquoi? Allume la lumière" -> {"command": "1", "response": " Ok j'allume la lumière, La température diminue généralement avec l'altitude en raison de la diminution de la pression atmosphérique. L'air se dilate et se refroidit à mesure qu'il monte."}
            `,
          },
          {
            role: 'user',
            content: `${command}`,
          },
        ],
        max_tokens: 150,
        temperature: 0,
      });

      console.log('API Response:', completion);

      const responseText = completion.choices[0].message.content.trim();

      // Add a check to ensure the response is a valid JSON
      let response;
      try {
        response = JSON.parse(responseText);
      } catch (error) {
        response = {
          command: '0',
          response: responseText,
        };
      }

      return response;
    } catch (error) {
      console.error('Error interpreting command:', error);

      // Handle errors when parsing JSON or interpreting command
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse JSON response from OpenAI');
      }

      throw new Error('Error interpreting command');
    }
  }
}
/*
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

*/
