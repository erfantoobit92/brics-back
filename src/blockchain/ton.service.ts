import { Injectable, Logger } from '@nestjs/common';
import { TonClient, Address } from '@ton/ton';
// import { getHttpEndpoint } from '@orbs-network/ton-access';

@Injectable()
export class TonBlockchainService {
  private client: TonClient;
  private readonly logger = new Logger(TonBlockchainService.name);

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    const endpoint = 'https://toncenter.com/api/v2/jsonRPC';
    const apiKey = process.env.TONCENTER_API_KEY; // Optional: for higher rate limits

    this.client = new TonClient({
      endpoint,
      apiKey: apiKey, // You can get a free API key from toncenter.com
    });
    this.logger.log('TonClient initialized with a direct endpoint.');
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

      const transactions = await this.client.getTransactions(projectAddress, {
        limit: 100,
      });

      const requiredAmountNano = BigInt(requiredAmount * 1e9); // Convert TON to nanoton

      for (const tx of transactions) {
        const msg = tx.inMessage;
        if (!msg || !msg.info) continue;

        const info = msg.info as any;

        if (info.type === 'internal') {
          const senderAddress = info.src?.toRawString?.() ?? '';
          const txValue = info.value?.coins ?? 0n;
          // const txTimestamp = new Date(tx.now * 1000);

          const isCorrectSender = senderAddress == userAddress.toRawString();
          const isSufficientAmount = txValue >= requiredAmountNano;
          // const isAfterTaskStart = txTimestamp > afterTimestamp;
          // console.log('txValue', txValue);
          // console.log('txTimestamp', txTimestamp);
          // console.log('isCorrectSender', isCorrectSender);
          // console.log('isSufficientAmount', isSufficientAmount);
          // console.log('isAfterTaskStart', isAfterTaskStart);

          if (isCorrectSender && isSufficientAmount) {
            this.logger.log(
              `✅ Valid transaction from ${userWalletAddress} for ${requiredAmount} TON.`,
            );
            return true;
          }
        }
      }
      console.log('false transaction found!');

      return false;
    } catch (e) {
      if (e.isAxiosError && e.response?.status === 500) {
        this.logger.warn(
          `Toncenter API returned 500 for address ${projectWalletAddress}. Assuming it has no transactions.`,
        );
        return false; // به جای کرش کردن، فرض می‌کنیم تراکنشی پیدا نشده
      }
      throw e;
    }
  }
}
