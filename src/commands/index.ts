import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';

@Module({
  controllers: [CommandController],
  providers: [CommandService],
})
export class CommandModule {}
