import { Controller, Post, Body } from '@nestjs/common';
import { CommandService } from './command.service';

@Controller('commands')
export class CommandController {
  constructor(private readonly commandService: CommandService) {}

  @Post('interpret')
  async interpretCommand(
    @Body('command') command: string,
  ): Promise<{ command: string; response: string }> {
    const classification = await this.commandService.interpretCommand(command);
    return classification;
  }
}
