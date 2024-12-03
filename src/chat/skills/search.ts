import { AITool } from '../ai.interface';
import { customsearch_v1 } from '@googleapis/customsearch';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanQuery } from 'src/utils';
import { URL } from 'url';

interface SearchResponse {
  title: string;
  link: string;
  snippet: string;
  content?: string;
}

export class SearchTool implements AITool {
  name = 'web_search';
  private readonly API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  private readonly SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_CX;
  private readonly customsearch = new customsearch_v1.Customsearch({
    auth: this.API_KEY,
  });

  private async fetchPageContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Supprimer tous les éléments et attributs liés au style
      $('script, style, link[rel="stylesheet"]').remove();
      $('[style]').removeAttr('style');
      $('*').removeAttr('class');
      $('*').removeAttr('id');

      // Nettoyer le texte
      return $('body').text().replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error(`Error fetching content from ${url}:`, error);
      return '';
    }
  }

  async execute(params: {
    query: string;
    numResults: number;
    fetchContent?: boolean;
    country?: string;
  }): Promise<SearchResponse[]> {
    try {
      if (!params?.query) {
        console.log('❌ Requête de recherche manquante');
        return [];
      }

      const cleanedQuery = cleanQuery(params.query);
      console.log(`📝 Requête de recherche: "${cleanedQuery}"`);
      console.log(`🔍 Nombre de résultats demandés: ${params.numResults}`);
      console.log(`🌍 Pays de recherche: ${params.country || 'us'}`);

      const extractUrl = (text: string): string | null => {
        const cleanedText = text.replace(
          /^(résume|resume|summarize|traduit)\s+|\s+(résume|resume|summarize|traduit)$/i,
          '',
        );

        const urlRegex =
          /https?:\/\/[^\s]+?(?=\s|$)|(?:[\w-]+\.)+[\w-]+(?:\/[^\s]*)?/gi;
        const matches = cleanedText.match(urlRegex);
        console.log(
          `🔍 URL détectée par regex: ${matches ? matches.join(', ') : 'Aucune'}`,
        );

        if (matches) {
          let url = matches.reduce((longest, current) => {
            if (current.startsWith('http')) {
              return current.length > longest.length ? current : longest;
            }
            return longest;
          }, matches[0]);

          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          try {
            new URL(url);
            return url;
          } catch {
            return null;
          }
        }
        return null;
      };

      const extractedUrl = extractUrl(cleanedQuery);
      if (extractedUrl) {
        console.log(`🌐 URL extraite et validée: ${extractedUrl}`);
        try {
          const content = await this.fetchPageContent(extractedUrl);
          if (content) {
            console.log("✅ Accès direct à l'URL réussi");
            console.log(
              `📄 Début du contenu direct: "${content.slice(0, 20)}..."`,
            );
            return [
              {
                title: extractedUrl,
                link: extractedUrl,
                snippet: content.slice(0, 200),
                content: content,
              },
            ];
          }
        } catch (error) {
          console.log(
            "❌ Impossible d'accéder directement à l'URL, passage en mode recherche",
          );
        }
      } else {
        console.log("❌ Aucune URL valide n'a été extraite de la requête");
      }

      console.log('🔍 Recherche par mots-clés...');
      const response = await this.customsearch.cse.list({
        q: cleanedQuery,
        cx: this.SEARCH_ENGINE_ID,
        num: params.numResults || 5,
        gl: params.country || 'us',
        hl: params.country || 'us',
      });

      if (!response.data.items) {
        console.log('❌ Aucun résultat trouvé pour cette recherche');
        return [];
      }

      const results: SearchResponse[] = response.data.items.map(
        (item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        }),
      );

      if (params.fetchContent !== false) {
        const contentsPromises = results.map((result) =>
          this.fetchPageContent(result.link),
        );
        const contents = await Promise.all(contentsPromises);
        results.forEach((result, index) => {
          result.content = contents[index];
          if (result.content) {
            console.log(
              `📄 Début du contenu recherché pour ${result.link} (20 premiers caractères): "${result.content.slice(0, 20)}..."`,
            );
          }
        });
      }

      console.log(`✅ ${results.length} résultats trouvés`);
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  getSchema() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description:
          'Perform a web search OR directly access URL content. ' +
          'If a complete URL is provided, its content will be directly extracted. ' +
          'Otherwise, a web search will be performed with the provided terms. ' +
          'DO NOT add dates to the search terms unless explicitly specified by the user. ' +
          'At the end of your response, list your sources url one per line with "Sources:" as header.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Complete URL for direct access (e.g., https://example.com/article) ' +
                'OR search terms for web search. ' +
                'If a URL is detected, its content will be directly extracted. ' +
                'DO NOT add dates to the search terms unless explicitly specified by the user. (ex: Octobre 2023, 2023)' +
                'Avoid adding dates unless specified.',
            },
            numResults: {
              type: 'integer',
              description:
                'Number of results to return for keyword search (minimum: 5, maximum: 10). ' +
                'Ignored if a direct URL is provided.',
              minimum: 5,
              maximum: 10,
            },
            country: {
              type: 'string',
              description:
                'Use us even if the language is french. Use fr for french subject. Country code for search (e.g., us, fr). Default: us.' +
                'Used only for keyword searches.',
              enum: ['us', 'fr', 'uk'],
            },
            fetchContent: {
              type: 'boolean',
              description: 'Retrieve page content (default: true)',
            },
          },
          required: ['query', 'numResults'],
          additionalProperties: false,
        },
      },
    };
  }
}
