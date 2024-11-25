import { AITool } from '../ai.interface';
import { DateTimeTool } from './dateTime';
import { WeatherTool } from './weather';

export const defaultTools: AITool[] = [
  new DateTimeTool(),
  new WeatherTool(),
  // Ajouter d'autres outils ici au fur et à mesure
];

// Réexporter les classes des tools si nécessaire
export { DateTimeTool, WeatherTool };
