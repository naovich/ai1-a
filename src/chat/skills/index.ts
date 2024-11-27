import { AITool } from '../ai.interface';
import { DateTimeTool } from './dateTime';
import { WeatherTool } from './weather';
import { SearchTool } from './search';

export const defaultTools: AITool[] = [
  new DateTimeTool(),
  new WeatherTool(),
  new SearchTool(),
];

export { DateTimeTool, WeatherTool, SearchTool };
