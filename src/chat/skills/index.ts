import { AITool } from '../ai.interface';
import { DateTimeTool } from './dateTime';
import { WeatherTool } from './weather';
import { SearchTool } from './search';
import { PerplexityTool } from './perplexity';

export const defaultTools: AITool[] = [
  new DateTimeTool(),
  new WeatherTool(),
  new PerplexityTool(),
];

export { DateTimeTool, WeatherTool, SearchTool };
