import { AITool } from '../ai.interface';

export class DateTimeTool implements AITool {
  name = 'get_date_and_time';

  async execute() {
    const today = new Date();
    return {
      date: today.toISOString().split('T')[0],
      datetime: today.toISOString(),
      time: today.toLocaleTimeString(),
    };
  }

  getSchema() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: "Obtenir la date actuelle et/ou l'heure courante",
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'La date au format YYYY-MM-DD',
            },
            datetime: {
              type: 'string',
              description: "La date et l'heure au format ISO",
            },
            time: {
              type: 'string',
              description: "L'heure locale au format HH:MM:SS",
            },
          },
          required: ['date', 'datetime', 'time'],
          additionalProperties: false,
        },
      },
    };
  }
}
