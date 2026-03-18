# BitTON.AI -- Smart Contracts Overview

## Product Parameters

| Parameter | Flex 30 | Boost 180 | Max 360 |
|-----------|---------|-----------|---------|
| Lock period | 30 days | 180 days | 360 days |
| Staking token | USDC | USDC | USDC |
| Approx yield | ~7.5% per cycle | ~1% per day | ~250% APR |
| Reward split (Liquid / Vested) | 50% / 50% | 20% / 80% | 15% / 85% |
| Principal returned | Yes | No | No |
| Vesting type | Short (30d freeze + 60d linear) | Long (180d freeze + 180d linear) | Long (180d freeze + 180d linear) |

## Contracts

### BTNToken (Legacy, non-upgradeable)
- ERC-20 with 21M max supply, 6 decimals
- Minter management, burning, EIP-2612 permit
- Deployed and immutable

### CustodialDistribution (Non-upgradeable)
- Holds BTN treasury
- `distribute(to, amount)` -- send BTN to user
- `batchMigrate(recipients[], amounts[])` -- bulk migration
- `fundContract(target, amount)` -- fund other contracts (e.g., RewardEngine)
- `finalize()` -- permanently renounce all admin roles
- AccessControl: OPERATOR_ROLE, EMERGENCY_ROLE, DEFAULT_ADMIN_ROLE

### VaultManager (UUPS Proxy)
- Users activate a vault tier (T1/T2/T3) by paying USDT or BTN
- `activateVault(tier)` -- pays fee, activates vault
- `isVaultActive(user)` / `getUserTier(user)`
- Uses Chainlink oracle for BTN/USD price (1h staleness check)
- BTN conversion uses $2.25 platform price
- Fees: T1=$50, T2=$250, T3=$1000

### StakingVault (UUPS Proxy)
- Supports 3 staking products: Flex30 (type 0), Boost180 (type 1), Max360 (type 2)
- `stake(amount, productType)` -- deposits USDC (or BTN when enabled) into the selected product
- `unstake(stakeIndex)` -- withdraws stake; Flex30 returns principal at maturity, Boost180/Max360 enforce full lock
- Per-product reward rates applied during settlement
- Tracks `btnEquivalent` for each USDC stake (converted at platform price $2.25) for bonus calculations
- Requires active vault for staking
- BTN staking is gated and reserved for future activation; currently USDC only

### RewardEngine (UUPS Proxy)
- `settleWeekly(user)` -- calculates accrued rewards per stake
- Per-product reward splits:
  - Flex 30: 50% liquid, 50% vested
  - Boost 180: 20% liquid, 80% vested
  - Max 360: 15% liquid, 85% vested
- Liquid portion routed to WithdrawalWallet
- Vested portion routed to VestingPool with appropriate vesting schedule
- Compounding boost: users who restake liquid rewards receive a bonus multiplier
- `fundRewards(amount)` -- owner funds BTN into reward pool
- Calls BonusEngine for matching bonuses on settlement

### VestingPool (UUPS Proxy)
- Per-deposit vesting tracking (each vesting entry tracked individually)
- Two vesting schedules:
  - **Short**: 30-day freeze period, then 60-day linear daily release
  - **Long**: 180-day freeze period, then 180-day linear daily release
- `addVesting(user, amount, vestingType)` -- called by RewardEngine
- `release(user)` -- iterates deposits, releases unlocked amounts to WithdrawalWallet
- `earlyUnlock(depositIndex)` -- allows early unlock with penalty (penalty goes to ReserveFund)
- `getVestedBalance(user)` / `getPendingRelease(user)`

### WithdrawalWallet (UUPS Proxy)
- Dual-token withdrawal: users can withdraw as BTN or USDC
- `addWithdrawable(user, amount)` -- called by RewardEngine or VestingPool (amount in BTN)
- `withdrawBTN(amount)` -- user withdraws BTN directly
- `withdrawUSDC(amount)` -- converts BTN balance to USDC at platform price ($2.25) and sends USDC
- `getWithdrawableBalance(user)` -- returns balance in BTN terms
- Weekly withdrawal cap enforced, resets every 7 days

### BonusEngine (UUPS Proxy)
- `registerReferrer(referrer)` -- one-time per user
- `processDirectBonus(referrer, stakeAmount)` -- 5% of stake (in BTN equivalent)
- `processMatchingBonus(user, rewardAmount)` -- level-based percentage of downline rewards
- Qualification: active vault + 500 BTN minimum personal stake
- Matching depth: T1 = 3 levels, T2 = 5 levels, T3 = 10 levels
- Bonuses credited to WithdrawalWallet

### ReserveFund (UUPS Proxy)
- Replaces the previous burn mechanism
- Receives: early unstake penalties, early vesting unlock penalties, protocol fees
- `deposit(amount)` -- called by other contracts to route funds
- `withdraw(to, amount)` -- admin-only, for redeploying reserves
- Holds BTN (and optionally USDC) as protocol reserves
- Transparent on-chain accounting of all inflows

## Access Control Roles

| Role | Holders | Purpose |
|------|---------|---------|
| DEFAULT_ADMIN_ROLE | Deployer (then multisig) | Upgrade, role management |
| OPERATOR_ROLE | Backend relayer, other contracts | Settlement, distribution |
| EMERGENCY_ROLE | Admin | Pause/unpause |

## Cross-Contract Wiring

```
StakingVault ──> RewardEngine ──> VestingPool
                       |               |
                       v               v
                  BonusEngine    WithdrawalWallet
                       |               ^
                       v               |
                  WithdrawalWallet     ReserveFund
```

OPERATOR_ROLE grants required:
1. RewardEngine on StakingVault (read stakes)
2. RewardEngine on VestingPool (add vesting)
3. RewardEngine on WithdrawalWallet (add withdrawable)
4. VestingPool on WithdrawalWallet (add withdrawable on release)
5. BonusEngine on WithdrawalWallet (add bonus withdrawable)
6. BonusEngine on RewardEngine (process bonuses)
7. StakingVault on ReserveFund (deposit penalties)
8. VestingPool on ReserveFund (deposit early unlock penalties)
9. Backend relayer on RewardEngine (trigger settlement)

## Test Coverage

- 77 tests passing (rewritten for new 3-product system)
- Covers: product-specific staking, per-product reward splits, freeze+linear vesting, dual-token withdrawal, reserve fund flows, bonus engine, access control

## Deployed Addresses

See `DEPLOYMENT_SUMMARY_TESTNET.md` for Base Sepolia addresses.
