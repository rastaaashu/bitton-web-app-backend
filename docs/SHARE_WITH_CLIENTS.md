# BitTON.AI -- Share Package (V2 -- Base Sepolia)

**Network:** Base Sepolia | **Chain ID:** 84532 | **Date:** 2026-03-18

---

## Deployed Contract Addresses (V2)

| # | Contract | Address | Type |
|---|----------|---------|------|
| 1 | **BTN Token** | `0x5b964baafEDf002e5364F37848DCa1908D3e4e9f` | ERC-20 (6 decimals, 21M cap) |
| 2 | **USDC Token** | `0x69Bc9E30366888385f68cBB566EEb655CD5A34CC` | ERC-20 (mock, 6 decimals) |
| 3 | **VaultManager** | `0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553` | UUPS Proxy |
| 4 | **StakingVault** | `0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B` | UUPS Proxy |
| 5 | **RewardEngine** | `0x97d1d86c709F4d5aEb93f46A60A16941c03076c0` | UUPS Proxy |
| 6 | **VestingPool** | `0x79D2CA5fb7ACF936198ec823a006a34cB611389e` | UUPS Proxy |
| 7 | **WithdrawalWallet** | `0xa523b6B9c3F2191C02ACfEc92C319D66315a3768` | UUPS Proxy |
| 8 | **BonusEngine** | `0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC` | UUPS Proxy |
| 9 | **ReserveFund** | `0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D` | UUPS Proxy |

---

## What Each Contract Does (V2)

| Contract | Description |
|----------|-------------|
| **BTN Token** | ERC-20 token with 6 decimals, 21M max supply, owner-mintable. |
| **VaultManager** | Manages vault activation tiers (T1=$25, T2=$50, T3=$100) with USDC or BTN payment. |
| **StakingVault** | 3 products: Flex30 (30d, 0.25%/day), Boost180 (180d, 1.0%/day), Max360 (360d, 0.69%/day). USDC deposits only. |
| **RewardEngine** | Settles rewards with per-product splits: 50/50, 20/80, 15/85 (liquid/vested). |
| **VestingPool** | Per-deposit vesting: Short (30d freeze + 60d linear), Long (180d freeze + 180d linear). |
| **WithdrawalWallet** | Dual-token withdrawal: users withdraw as BTN or USDC (converted at $2.25 platform price). |
| **BonusEngine** | Direct bonus (5% of stake) + matching bonus (10 levels: 10/7/5/4/3/2/2/1/1/1%). |
| **ReserveFund** | Receives early exit penalties and protocol reserves. |

---

## Live Services

| Service | URL |
|---------|-----|
| Frontend | https://bitton-contracts.vercel.app |
| Backend | https://bitton-backend.onrender.com |
| Health Check | https://bitton-backend.onrender.com/health |

---

## Quick Reference (Copy/Paste)

```
Network:             Base Sepolia (chainId 84532)
RPC:                 https://sepolia.base.org

BTN Token:           0x5b964baafEDf002e5364F37848DCa1908D3e4e9f
USDC Token:          0x69Bc9E30366888385f68cBB566EEb655CD5A34CC
VaultManager:        0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553
StakingVault:        0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B
RewardEngine:        0x97d1d86c709F4d5aEb93f46A60A16941c03076c0
VestingPool:         0x79D2CA5fb7ACF936198ec823a006a34cB611389e
WithdrawalWallet:    0xa523b6B9c3F2191C02ACfEc92C319D66315a3768
BonusEngine:         0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC
ReserveFund:         0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D

BTN Platform Price:  $2.25
Frontend:            https://bitton-contracts.vercel.app
Backend:             https://bitton-backend.onrender.com
```

---

## Documentation Index

| Doc | Path | Description |
|-----|------|-------------|
| System Overview | `docs/00_SYSTEM_OVERVIEW.md` | Architecture and component map |
| Auth & Registration | `docs/01_AUTH_AND_REGISTRATION.md` | Multi-method auth flows |
| Backend API | `docs/03_BACKEND_API.md` | REST API endpoints |
| Contracts Overview | `docs/04_CONTRACTS_OVERVIEW.md` | Smart contract details (V2) |
| Operations Runbook | `docs/05_OPERATIONS_RUNBOOK.md` | Deployment and admin procedures |
| Mainnet Readiness | `docs/06_MAINNET_READINESS.md` | Pre-mainnet checklist |
| Deployment Summary | `docs/DEPLOYMENT_SUMMARY_TESTNET.md` | V2 testnet addresses |
| Diagrams | `docs/DIAGRAMS.md` | Mermaid diagram source |

---

## Test Suite

77 tests passing. Run with:

```bash
npx hardhat test
```
