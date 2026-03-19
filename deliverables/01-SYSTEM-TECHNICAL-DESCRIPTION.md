# BitTON.AI -- Technical System Description (V2)
**For: DevOps & Security Team**
**Date: 2026-03-18**
**Version: 2.0**

---

## 1. System Overview

BitTON.AI is a DeFi staking and referral platform deployed on **Base Sepolia** (testnet, Chain ID 84532). The V2 system features 3 staking products with USDC deposits, dual-channel rewards, and a ReserveFund contract.

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Smart Contracts | Solidity 0.8.27, UUPS Proxies (OpenZeppelin) | Base Sepolia blockchain |
| Backend API | Node.js + TypeScript + Express + Prisma + PostgreSQL | Render |
| Frontend | Next.js 14 + React + Tailwind + RainbowKit + Wagmi | Vercel |

---

## 2. Deployed Contract Addresses (V2 -- Base Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| BTN Token | `0x5b964baafEDf002e5364F37848DCa1908D3e4e9f` | ERC-20 token (6 decimals, 21M max supply) |
| USDC Token | `0x69Bc9E30366888385f68cBB566EEb655CD5A34CC` | Stablecoin for staking deposits |
| VaultManager | `0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553` | Tier activation (T1=$25, T2=$50, T3=$100) |
| StakingVault | `0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B` | 3 products: Flex30, Boost180, Max360 |
| RewardEngine | `0x97d1d86c709F4d5aEb93f46A60A16941c03076c0` | Per-product dual-channel reward splits |
| VestingPool | `0x79D2CA5fb7ACF936198ec823a006a34cB611389e` | Freeze + linear release vesting |
| WithdrawalWallet | `0xa523b6B9c3F2191C02ACfEc92C319D66315a3768` | Dual-token withdrawal (BTN or USDC) |
| BonusEngine | `0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC` | Direct (5%) + matching (10-level) bonuses |
| ReserveFund | `0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D` | Receives penalties and protocol reserves |

All 7 core contracts (VaultManager through ReserveFund) use **UUPS proxy pattern** and are upgradeable.

---

## 3. V2 Staking Products

| Product | Type | Lock | Daily Rate | Liquid/Vested Split | Principal |
|---------|------|------|------------|---------------------|-----------|
| Flex 30 | 0 | 30 days | 0.25% | 50% / 50% | Returned at maturity |
| Boost 180 | 1 | 180 days | 1.0% | 20% / 80% | Sent to treasury |
| Max 360 | 2 | 360 days | 0.69% | 15% / 85% | Sent to treasury |

- **Staking token**: USDC (BTN staking gated for future)
- **Early exit**: Flex 30 only, 15% penalty to ReserveFund
- **BTN platform price**: $2.25 for all conversions

### Vesting Schedules

| Type | Freeze Period | Linear Release |
|------|---------------|----------------|
| Short (Flex 30) | 30 days | 60 days |
| Long (Boost 180 / Max 360) | 180 days | 180 days |

### Matching Bonus (10 levels)

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-------|---|---|---|---|---|---|---|---|---|---|
| % | 10 | 7 | 5 | 4 | 3 | 2 | 2 | 1 | 1 | 1 |

Depth: T1=3 levels, T2=5 levels, T3=10 levels. Qualification: active vault + 500 BTN min stake.

---

## 4. Security Features

- **UUPS Proxy** -- Upgradeable with admin-only authorization
- **ReentrancyGuard** -- On all withdrawal/transfer functions
- **SafeERC20** -- All token transfers use safe wrappers
- **Pausable** -- Emergency pause on all contracts
- **AccessControl** -- Role-based (ADMIN, OPERATOR, EMERGENCY)
- **Checks-Effects-Interactions** -- Pattern enforced throughout
- **Storage Gap** -- 50 slots reserved for future upgrades

---

## 5. Live Services

| Service | URL |
|---------|-----|
| Frontend | https://bitton-contracts.vercel.app |
| Backend | https://bitton-backend.onrender.com |
| Health Check | https://bitton-backend.onrender.com/health |

---

## 6. Test Suite

- **77 tests passing** (V2 system)
- Framework: Hardhat + Chai + ethers.js
- Run: `npx hardhat test`
