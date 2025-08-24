import { Injectable, Logger } from '@nestjs/common';
import { TonClient, Address } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

@Injectable()
export class TonBlockchainService {
  private client: TonClient;
  private readonly logger = new Logger(TonBlockchainService.name);

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    const endpoint = await getHttpEndpoint({ network: 'mainnet' });
    this.client = new TonClient({ endpoint });
  }

  /**
   * Verifies if a user has sent a specific amount of TON to the project wallet.
   * @param projectWalletAddress The wallet address of your project.
   * @param userWalletAddress The user's wallet address.
   * @param requiredAmount The minimum amount in TON (e.g., 2).
   * @param afterTimestamp The transaction must have occurred after this time.
   * @returns true if a valid transaction is found.
   */
  async verifyTonTransaction(
    projectWalletAddress: string,
    userWalletAddress: string,
    requiredAmount: number, // in TON
    afterTimestamp: Date,
  ): Promise<boolean> {
    if (!this.client) {
        await this.initializeClient(); // Ensure client is ready
    }
      
    try {
      const projectAddress = Address.parse(projectWalletAddress);
      const userAddress = Address.parse(userWalletAddress);

      // Get last 100 transactions for the project's wallet
      const transactions = await this.client.getTransactions(projectAddress, {
        limit: 100,
      });

      const requiredAmountNano = BigInt(requiredAmount * 1e9); // Convert TON to nanoton

      for (const tx of transactions) {
        // Check for incoming messages
        if (tx.inMessage && tx.inMessage.info.type === 'internal') {
          const senderAddress = tx.inMessage.info.src;
          const txValue = tx.inMessage.info.value.coins;
          const txTimestamp = new Date(tx.now * 1000);

          // 1. Is the sender the user we're checking?
          // 2. Is the amount sufficient?
          // 3. Was the transaction made AFTER the user started the task? (Prevents re-using old tx)
          if (
            senderAddress.equals(userAddress) &&
            txValue >= requiredAmountNano &&
            txTimestamp > afterTimestamp
          ) {
            this.logger.log(`Valid transaction found for user ${userWalletAddress}`);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      this.logger.error(`Error verifying TON transaction for ${userWalletAddress}:`, error.stack);
      return false;
    }
  }
}