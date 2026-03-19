# BitTON.AI -- System Overview

## What is BitTON.AI?

BitTON.AI is a staking and rewards platform on Base L2. Users stake USDC into one of three products (Flex 30, Boost 180, Max 360) and earn dual-channel rewards: a liquid portion (immediately withdrawable as BTN or USDC) and a vested portion (BTN with freeze + linear unlock). The platform includes a tiered vault system, referral bonuses, and on-chain reward accounting.

## Core Components

### Smart Contracts (Base Sepolia)

| Contract | Address | Purpose | Proxy |
|----------|---------|---------|-------|
| BTNToken | `0x5b964baafEDf002e5364F37848DCa1908D3e4e9f` | ERC-20 token (21M supply, 6 decimals) | No |
| USDC Token | `0x69Bc9E30366888385f68cBB566EEb655CD5A34CC` | Stablecoin for staking deposits | No |
| VaultManager | `0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553` | Tier activation (T1=$25, T2=$50, T3=$100) | UUPS |
| StakingVault | `0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B` | 3 products: Flex30, Boost180, Max360 (USDC) | UUPS |
| RewardEngine | `0x97d1d86c709F4d5aEb93f46A60A16941c03076c0` | Per-product dual-channel reward splits | UUPS |
| VestingPool | `0x79D2CA5fb7ACF936198ec823a006a34cB611389e` | Freeze + linear release vesting | UUPS |
| WithdrawalWallet | `0xa523b6B9c3F2191C02ACfEc92C319D66315a3768` | Dual-token withdrawal (BTN or USDC) | UUPS |
| BonusEngine | `0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC` | Direct (5%) + matching (10-level) referral bonuses | UUPS |
| ReserveFund | `0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D` | Receives penalties and protocol reserves | UUPS |

### Backend (Node.js + TypeScript)

- **Auth**: Wallet (RainbowKit), Email (OTP), Telegram -- all independent, no wallet required for email/telegram login
- **Operator**: Background job runner for on-chain transactions
- **Admin**: User management, system monitoring
- **Deployed at**: https://bitton-backend.onrender.com

### Frontend (Next.js 14)

- **Deployed at**: https://bitton-contracts.vercel.app
- Multi-method auth, 3-product staking UI, dual-token withdrawal, vesting dashboard

## Architecture Diagram

```
┌──────────────┐     ┌──────────────┐
│   Frontend   │────>│   Backend    │
│  (Next.js)   │     │  (Express)   │
│  Vercel      │     │  Render      │
└──────────────┘     └──────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  PostgreSQL   │
                    └───────────────┘
                            │
                    ┌───────▼───────┐
                    │  Base L2 RPC  │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
     ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
     │ VaultManager│ │StakingVault│ │RewardEngine │
     └─────────────┘ └───────────┘ └─────────────┘
                                          │
                          ┌───────────────┼──────────┐
                    ┌─────▼─────┐   ┌─────▼────┐ ┌──▼───────┐
                    │VestingPool│   │Withdrawal│ │BonusEngine│
                    └───────────┘   │  Wallet  │ └──────────┘
                                    └──────────┘
                          ┌─────────────┐
                          │ ReserveFund │
                          └─────────────┘
```

## Key Numbers

- **BTN supply**: 21,000,000 (6 decimals)
- **BTN platform price**: $2.25
- **Staking token**: USDC (BTN staking gated for future)
- **Flex 30**: 30-day lock, 0.25%/day, 50/50 liquid/vested split, principal returned
- **Boost 180**: 180-day lock, 1.0%/day, 20/80 split, principal to treasury
- **Max 360**: 360-day lock, 0.69%/day, 15/85 split, principal to treasury
- **Early exit penalty**: 15% (Flex 30 only, goes to ReserveFund)
- **Short vesting**: 30-day freeze + 60-day linear release
- **Long vesting**: 180-day freeze + 180-day linear release
- **Direct referral bonus**: 5% of stake (BTN equivalent)
- **Matching bonus levels**: 10% / 7% / 5% / 4% / 3% / 2% / 2% / 1% / 1% / 1%
- **Matching depth**: T1=3 levels, T2=5 levels, T3=10 levels
- **Matching qualification**: Active vault + 500 BTN min personal stake
- **Vault fees**: T1=$25, T2=$50, T3=$100

## Network

- **Testnet**: Base Sepolia (chainId 84532)
- **Mainnet**: Base (chainId 8453)
