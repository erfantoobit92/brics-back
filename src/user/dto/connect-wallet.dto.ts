import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectWalletDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}