// src/chat/skills/perplexity.ts
import { AITool } from '../ai.interface';
import axios from 'axios';

export class PerplexityTool implements AITool {
  name = 'perplexity_search';
  private readonly API_KEY = process.env.PERPLEXITY_API_KEY;
  private model = [
    'llama-3.1-sonar-small-128k-online',
    'llama-3.1-sonar-large-128k-online',
    'llama-3.1-sonar-huge-128k-online',
  ];

  async execute(args: {
    query: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }) {
    console.log('🔍 Requête de recherche:', args.query);

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: this.model[1],
          messages: [
            {
              role: 'system',
              content: 'Make a large answer, with a lot of details.',
            },
            {
              role: 'user',
              content: args.query,
            },
          ],

          max_tokens: args.max_tokens,
          // search_domain_filter: ['perplexity.ai'],
          return_images: true,
          return_related_questions: false,
          search_recency_filter: 'month',
          frequency_penalty: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(
        '🔍 Réponse de Perplexity:',
        response.data.choices[0].message.content,
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw error;
    }
  }

  getSchema() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description:
          "Quand il faut faire une recherche sur internet, par exemple pour des données récente.Réponds d'abord précisément à la question posée en quelques phrase, ensuite tu donne les autres informations que tu as reçu relative à la question posée.",
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'La question ou requête à poser',
            },
            /*model: {
              type: 'string',
              description:
                'Le modèle à utiliser (par défaut: llama-3.1-sonar-small-128k-online)',
            },
            temperature: {
              type: 'number',
              description:
                'Température pour la génération (0.0 à 1.0, par défaut: 0.2)',
            },
            max_tokens: {
              type: 'integer',
              description: 'Nombre maximum de tokens à générer',
            },
            */
          },
          required: ['query'],
        },
      },
    };
  }
}
