import { AITool } from '../ai.interface';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

interface SearchResponse {
  title: string;
  link: string;
  snippet: string;
}

export class SearchTool implements AITool {
  name = 'web_search';
  private readonly API_KEY = process.env.GOOGLE_API_KEY;
  private readonly SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
  private readonly BASE_URL = 'https://www.googleapis.com/customsearch/v1';

  async execute(params: {
    query: string;
    numResults?: number;
  }): Promise<SearchResponse[]> {
    try {
      const response = await axios.get(this.BASE_URL, {
        params: {
          key: this.API_KEY,
          cx: this.SEARCH_ENGINE_ID,
          q: params.query,
          num: params.numResults || 3,
        },
      });

      return response.data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));
    } catch (error: any) {
      console.error('Erreur de recherche:', error);
      throw new Error(error.message || "Impossible d'effectuer la recherche");
    }
  }

  getSchema() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description:
          'Effectuer une recherche sur le web et retourner les résultats pertinents',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Termes de recherche',
            },
            numResults: {
              type: 'number',
              description: 'Nombre de résultats à retourner (par défaut: 3)',
              minimum: 1,
              maximum: 10,
            },
          },
          required: ['query'],
          additionalProperties: false,
        },
      },
    };
  }
}
