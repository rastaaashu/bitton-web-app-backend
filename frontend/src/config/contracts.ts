export const CONTRACTS = {
  btnToken: "0x5b964baafEDf002e5364F37848DCa1908D3e4e9f" as const,
  usdcToken: "0x69Bc9E30366888385f68cBB566EEb655CD5A34CC" as const, // USDC on Base Sepolia (same as old USDT slot)
  usdtToken: "0x69Bc9E30366888385f68cBB566EEb655CD5A34CC" as const, // kept for backward compat
  vaultManager: "0xA2b5ffe829441768E8BB8Be49f8ADee0041Fa1b0" as const,
  stakingVault: "0x50d1516D6d5A4930623BCb7e1Ed28e9fAeA1e82F" as const,
  withdrawalWallet: "0xA06238c206C2757AD3f1572464bf720161519eC5" as const,
  vestingPool: "0xa3DC3351670E253d22B783109935fe0B9a11b830" as const,
  rewardEngine: "0xa86F6abB543b3fa6a2E2cC001870cF60a04c7f31" as const,
  bonusEngine: "0xFD57598058EC849980F87F0f44bb019A73a0EfC7" as const,
  reserveFund: "0x0000000000000000000000000000000000000000" as const, // TODO: set after deployment
  oracle: "0xf1DC093E1B3fD72A1C7f1B58bd3cE8A4832BEe52" as const,
  treasury: "0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A" as const,
  custodialDistribution: "0x71dB030B792E9D4CfdCC7e452e0Ff55CdB5A4D99" as const,
} as const;

export const BTN_DECIMALS = 6;
export const USDC_DECIMALS = 6;
export const USDT_DECIMALS = 6;
