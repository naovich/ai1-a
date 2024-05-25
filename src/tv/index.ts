import { Module } from '@nestjs/common';
import { TvService } from './tv.service';
import { TvController } from './tv.controller';

@Module({
  controllers: [TvController],
  providers: [TvService],
})
export class TvModule {}
