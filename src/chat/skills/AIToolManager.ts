import { AITool } from 'src/chat/ai.interface';

export abstract class AIToolManager {
  protected tools: Map<string, AITool> = new Map();

  protected registerTool(tool: AITool) {
    this.tools.set(tool.name, tool);
  }

  protected async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.execute(args);
  }

  protected getToolSchemas(): any[] {
    return Array.from(this.tools.values()).map((tool) => tool.getSchema());
  }
}
