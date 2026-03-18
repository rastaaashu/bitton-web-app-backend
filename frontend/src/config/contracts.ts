export const CONTRACTS = {
  btnToken: "0x5b964baafEDf002e5364F37848DCa1908D3e4e9f" as const,
  usdcToken: "0x69Bc9E30366888385f68cBB566EEb655CD5A34CC" as const, // USDC on Base Sepolia (same as old USDT slot)
  usdtToken: "0x69Bc9E30366888385f68cBB566EEb655CD5A34CC" as const, // kept for backward compat
  vaultManager: "0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553" as const,
  stakingVault: "0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B" as const,
  withdrawalWallet: "0xa523b6B9c3F2191C02ACfEc92C319D66315a3768" as const,
  vestingPool: "0x79D2CA5fb7ACF936198ec823a006a34cB611389e" as const,
  rewardEngine: "0x97d1d86c709F4d5aEb93f46A60A16941c03076c0" as const,
  bonusEngine: "0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC" as const,
  reserveFund: "0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D" as const,
  oracle: "0xf1DC093E1B3fD72A1C7f1B58bd3cE8A4832BEe52" as const,
  treasury: "0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A" as const,
  custodialDistribution: "0x71dB030B792E9D4CfdCC7e452e0Ff55CdB5A4D99" as const,
} as const;

export const BTN_DECIMALS = 6;
export const USDC_DECIMALS = 6;
export const USDT_DECIMALS = 6;
