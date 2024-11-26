import { AITool } from '../ai.interface';
import { DateTimeTool } from './dateTime';
import { WeatherTool } from './weather';

export const defaultTools: AITool[] = [new DateTimeTool(), new WeatherTool()];

export { DateTimeTool, WeatherTool };
