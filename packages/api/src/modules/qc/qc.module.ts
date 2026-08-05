import { Module } from '@nestjs/common';
import { QcController } from './qc.controller';
import { QcService } from './qc.service';

@Module({
  controllers: [QcController],
  providers: [QcService],
  exports: [QcService],
})
export class QcModule {}
