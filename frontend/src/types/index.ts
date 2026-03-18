// ─── Address type ───
export type Address = `0x${string}`;

// ─── Vault Tiers ───
export type VaultTier = 0 | 1 | 2 | 3; // 0 = none, 1 = T1, 2 = T2, 3 = T3

// ─── Staking Program Types ───
export type ProgramType = 0 | 1 | 2; // 0 = Flex30, 1 = Boost180, 2 = Max360

// ─── Stake Info (matches new contract struct) ───
export interface StakeInfo {
  amount: bigint;
  btnEquivalent: bigint;
  startTime: bigint;
  programType: number; // 0 = Flex30, 1 = Boost180, 2 = Max360
  lastRewardTime: bigint;
  active: boolean;
  isUSDC: boolean;
}

// ─── Vesting Deposit (matches new VestingPool struct) ───
export interface VestingDeposit {
  amount: bigint;
  depositTime: bigint;
  vestingType: number; // 0 = short (30d+60d), 1 = long (180d+180d)
  released: bigint;
  fullyReleased: boolean;
}

// ─── User Dashboard ───
export interface UserDashboard {
  btnBalance: bigint;
  usdcBalance: bigint;
  vaultActive: boolean;
  vaultTier: VaultTier;
  totalStaked: bigint;
  withdrawableBalance: bigint;
  vestedBalance: bigint;
  pendingRelease: bigint;
  pendingRewards: bigint;
  stakes: StakeInfo[];
}

// ─── Referral Info ───
export interface ReferralInfo {
  referrer: Address | null;
  downline: Address[];
  downlineCount: bigint;
  isQualified: boolean;
}

// ─── Tier Configuration ───
export interface TierConfig {
  id: VaultTier;
  name: string;
  feeUSD: number; // in dollars
  feeRaw: bigint; // 6 decimal USDT
  multiplier: number; // 1.0, 1.1, 1.2
  multiplierInt: number; // 10, 11, 12 (divide by 10)
  matchingLevels: number; // 3, 5, 10
  color: string;
}

// ─── Program Configuration ───
export interface ProgramConfig {
  type: ProgramType;
  name: string;
  fullName: string;
  lockDays: number;
  lockSeconds: number;
  dailyRateBps: number; // basis points per day
  dailyRatePercent: number; // human-readable %
  aprEstimate: string; // e.g., "~90%", "~180%", "~250%"
  liquidSplitPct: number; // % of rewards that are liquid (withdrawable)
  vestedSplitPct: number; // % that goes to vesting
  vestingType: "short" | "long"; // short: 30d+60d, long: 180d+180d
  principalReturned: boolean; // Flex30=true, others=false
  earlyExitAllowed: boolean;
  earlyExitPenaltyBps: number; // 1500 = 15%
  color: string;
}

// ─── Matching Bonus Level ───
export interface MatchingLevel {
  level: number;
  bps: number; // basis points
  percentage: string; // human readable
}

// ─── Transaction History Entry ───
export interface HistoryEntry {
  type: string;
  amount: string;
  date: string;
  txHash: string;
  details?: string;
}

// ─── Write Hook Return ───
export interface WriteHookReturn {
  write: (() => void) | undefined;
  writeAsync: (() => Promise<`0x${string}`>) | undefined;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  hash: `0x${string}` | undefined;
  reset: () => void;
}
