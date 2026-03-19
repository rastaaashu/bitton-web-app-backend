# BitTON.AI Staking Contracts

Smart contracts for the BitTON.AI dual-channel yield system on **Base** (Ethereum L2).

## Overview

BitTON.AI offers three staking products with USDC deposits and dual-channel rewards (liquid + vested BTN). Users activate a vault tier, stake USDC into one of three products, and earn rewards settled into a liquid portion (BTN or USDC) and a vested portion (BTN with freeze + linear unlock).

## Staking Products

| Product | Lock Period | Staking Token | Approx Yield | Reward Split (Liquid / Vested) |
|---------|-------------|---------------|---------------|-------------------------------|
| **Flex 30** | 30 days | USDC | ~7.5% per cycle | 50% / 50% |
| **Boost 180** | 180 days | USDC | ~1% per day | 20% / 80% |
| **Max 360** | 360 days | USDC | ~250% APR | 15% / 85% |

- **Flex 30**: Principal is returned at the end of the 30-day cycle.
- **Boost 180**: Higher daily rate with longer lock; majority of rewards vest.
- **Max 360**: Maximum yield over a full year; most rewards flow into vesting.

## Dual-Channel Rewards

Rewards are split per product into two channels:

- **Liquid channel**: Immediately withdrawable as BTN or USDC (converted at platform price).
- **Vested channel**: BTN locked in VestingPool with a freeze period followed by linear daily release.

### Vesting Schedules

| Product | Freeze Period | Linear Release Period |
|---------|---------------|-----------------------|
| Flex 30 / Short vesting | 30 days | 60 days |
| Boost 180 / Max 360 / Long vesting | 180 days | 180 days |

## BTN Platform Price

BTN is valued at **$2.25** for all platform conversions (vault fees paid in BTN, USDC withdrawal conversions).

## USDC Staking

All three products accept **USDC** deposits. BTN staking is gated and reserved for future activation.

## Reserve Fund

A dedicated ReserveFund contract replaces the previous burn mechanism. Penalty fees, protocol reserves, and excess funds are routed to the ReserveFund rather than being burned.

## Contracts

| # | Contract | Type | Description |
|---|----------|------|-------------|
| 1 | **BTNToken** | ERC-20 (non-upgradeable) | BitTON token, 21M max supply, 6 decimals, mint/burn, EIP-2612 permit |
| 2 | **VaultManager** | UUPS Proxy | Vault tier activation (T1/T2/T3), USDT or BTN payment, Chainlink oracle |
| 3 | **StakingVault** | UUPS Proxy | 3 products (Flex30/Boost180/Max360), USDC+BTN deposits, per-product rates, btnEquivalent tracking |
| 4 | **RewardEngine** | UUPS Proxy | Per-product reward splits (50/50, 20/80, 15/85), weekly settlement, compounding boost |
| 5 | **VestingPool** | UUPS Proxy | Per-deposit vesting, freeze + linear release schedule, early unlock option |
| 6 | **WithdrawalWallet** | UUPS Proxy | Dual-token withdrawal (BTN or USDC), platform price conversion |
| 7 | **BonusEngine** | UUPS Proxy | Direct bonus (5% of stake), matching bonus (level-based), tier-gated depth |
| 8 | **ReserveFund** | UUPS Proxy | Receives penalties and protocol reserves (replaces burns) |
| 9 | **CustodialDistribution** | Non-upgradeable | BTN treasury distribution, batch migration, contract funding |

## Project Structure

```
bitton-contracts/
├── contracts/
│   ├── BTNToken.sol
│   ├── VaultManager.sol
│   ├── StakingVault.sol
│   ├── RewardEngine.sol
│   ├── VestingPool.sol
│   ├── WithdrawalWallet.sol
│   ├── BonusEngine.sol
│   ├── ReserveFund.sol
│   ├── CustodialDistribution.sol
│   └── interfaces/
├── test/
│   ├── StakingVault.test.js
│   ├── RewardEngine.test.js
│   ├── VestingPool.test.js
│   ├── WithdrawalWallet.test.js
│   ├── BonusEngine.test.js
│   ├── ReserveFund.test.js
│   └── ...
├── scripts/
│   ├── deploy-*.js
│   └── ...
├── docs/
│   ├── 04_CONTRACTS_OVERVIEW.md
│   ├── 06_MAINNET_READINESS.md
│   └── ...
├── tasks/
│   ├── todo.md
│   └── lessons.md
├── hardhat.config.js
└── package.json
```

## Getting Started

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

**77 tests passing** across all contracts.

### Coverage

```bash
npx hardhat coverage
```

## Technical Details

- **Solidity**: 0.8.27
- **Framework**: Hardhat
- **Upgrade pattern**: OpenZeppelin UUPS Proxy (upgradeable contracts)
- **Token library**: OpenZeppelin SafeERC20 for all ERC-20 transfers
- **Security**: ReentrancyGuard, AccessControl (ADMIN / OPERATOR / EMERGENCY roles), Pausable
- **Oracle**: Chainlink price feed with 1-hour staleness check

## License

MIT
