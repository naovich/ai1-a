import { Module } from '@nestjs/common';
import { IoService } from './io.service';
import { IoController } from './io.controller';

@Module({
  controllers: [IoController],
  providers: [IoService],
})
export class IoModule {}
