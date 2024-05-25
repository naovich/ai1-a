import { Module } from '@nestjs/common';
import { LightService } from './light.service';
import { LightController } from './light.controller';

@Module({
  controllers: [LightController],
  providers: [LightService],
})
export class LightModule {}
