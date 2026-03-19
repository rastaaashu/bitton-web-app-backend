# BitTON.AI -- Smart Contracts Overview (V2)

## Staking Products

| Parameter | Flex 30 | Boost 180 | Max 360 |
|-----------|---------|-----------|---------|
| Product type | 0 | 1 | 2 |
| Lock period | 30 days | 180 days | 360 days |
| Staking token | USDC | USDC | USDC |
| Daily rate | 0.25% | 1.0% | 0.69% |
| Reward split (Liquid / Vested) | 50% / 50% | 20% / 80% | 15% / 85% |
| Principal returned | Yes | No (to treasury) | No (to treasury) |
| Early exit | Allowed (15% penalty to ReserveFund) | Not allowed | Not allowed |
| Vesting type | Short (30d freeze + 60d linear) | Long (180d freeze + 180d linear) | Long (180d freeze + 180d linear) |

## Deployed Contracts (Base Sepolia -- V2)

| Contract | Address | Type |
|----------|---------|------|
| BTN Token | `0x5b964baafEDf002e5364F37848DCa1908D3e4e9f` | ERC-20 |
| USDC Token | `0x69Bc9E30366888385f68cBB566EEb655CD5A34CC` | ERC-20 (mock) |
| VaultManager | `0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553` | UUPS Proxy |
| StakingVault | `0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B` | UUPS Proxy |
| RewardEngine | `0x97d1d86c709F4d5aEb93f46A60A16941c03076c0` | UUPS Proxy |
| VestingPool | `0x79D2CA5fb7ACF936198ec823a006a34cB611389e` | UUPS Proxy |
| WithdrawalWallet | `0xa523b6B9c3F2191C02ACfEc92C319D66315a3768` | UUPS Proxy |
| BonusEngine | `0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC` | UUPS Proxy |
| ReserveFund | `0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D` | UUPS Proxy |

## Contracts

### BTNToken (Non-upgradeable)
- ERC-20 with 21M max supply, 6 decimals
- Minter management, burning, EIP-2612 permit
- Deployed and immutable

### VaultManager (UUPS Proxy)
- Users activate a vault tier (T1/T2/T3) by paying USDC or BTN
- `activateVault(tier)` -- pays fee, activates vault
- `isVaultActive(user)` / `getUserTier(user)`
- BTN conversion uses $2.25 platform price
- Fees: T1=$25, T2=$50, T3=$100

### StakingVault (UUPS Proxy)
- Supports 3 staking products: Flex30 (type 0), Boost180 (type 1), Max360 (type 2)
- `stake(amount, productType)` -- deposits USDC into the selected product
- `unstake(stakeIndex)` -- Flex30 allows early exit with 15% penalty to ReserveFund; Boost180/Max360 enforce full lock
- Per-product reward rates: 0.25%/day (Flex30), 1.0%/day (Boost180), 0.69%/day (Max360)
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

### BonusEngine (UUPS Proxy)
- `registerReferrer(referrer)` -- one-time per user
- `processDirectBonus(referrer, stakeAmount)` -- 5% of stake (in BTN equivalent)
- `processMatchingBonus(user, rewardAmount)` -- level-based percentage of downline rewards
- Matching percentages: L1=10%, L2=7%, L3=5%, L4=4%, L5=3%, L6=2%, L7=2%, L8=1%, L9=1%, L10=1%
- Qualification: active vault + 500 BTN minimum personal stake
- Matching depth: T1=3 levels, T2=5 levels, T3=10 levels
- Bonuses credited to WithdrawalWallet

### ReserveFund (UUPS Proxy)
- Receives: early unstake penalties (Flex 30), early vesting unlock penalties, protocol fees
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
                  WithdrawalWallet    ReserveFund
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

- 77 tests passing (V2 3-product USDC staking system)
- Covers: product-specific staking, per-product reward splits, freeze+linear vesting, dual-token withdrawal, reserve fund flows, bonus engine, access control
