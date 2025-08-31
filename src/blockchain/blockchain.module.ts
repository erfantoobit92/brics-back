import { Module } from '@nestjs/common';
import { TonBlockchainService } from './ton.service';

@Module({
  providers: [TonBlockchainService],
  exports: [TonBlockchainService],
})
export class BlockchainModule {}
