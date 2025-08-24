import { Module } from '@nestjs/common';
import { TonBlockchainService } from './ton.service';

@Module({
  providers: [TonBlockchainService], // 1. We provide the service here
  exports: [TonBlockchainService],   // 2. We EXPORT it so other modules can see and use it
})
export class BlockchainModule {}