import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectWalletDto {
  //   @ApiProperty({
  //     example: 'UQ...your...wallet...address...here',
  //     description: "The user's TON wallet address",
  //   })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}
