# BitTON.AI -- Testing Guide (V2)
**For: DevOps / QA / Security Team**
**Date: 2026-03-18**
**Version: 2.0**

---

## 1. Testing Overview

This document describes how to test the BitTON.AI V2 platform, covering:
- Smart contract testing (Hardhat)
- Backend API testing
- Frontend testing

---

## 2. Smart Contract Tests

### 2.1 Run Tests

```bash
cd bitton-contracts
npm install
npx hardhat test          # 77 tests passing
npx hardhat coverage      # Coverage report
```

### 2.2 What Is Tested (V2)

| Area | Coverage |
|------|----------|
| 3 staking products (Flex30/Boost180/Max360) | Per-product staking, rates, locks |
| Per-product reward splits (50/50, 20/80, 15/85) | Settlement with correct splits |
| Vesting (freeze + linear release) | Short (30d+60d) and Long (180d+180d) |
| Dual-token withdrawal (BTN/USDC) | Both withdrawal paths |
| ReserveFund | Penalty routing, admin withdrawal |
| BonusEngine | Direct 5%, matching 10 levels (10/7/5/4/3/2/2/1/1/1%) |
| VaultManager | Tier activation (T1=$25, T2=$50, T3=$100) |
| Access control | OPERATOR_ROLE, ADMIN, EMERGENCY |
| Early exit | Flex 30 penalty (15% to ReserveFund) |
| USDC staking | Deposit, tracking, btnEquivalent |

### 2.3 Test Wallets

For testnet testing you need:
- Base Sepolia ETH (for gas) -- get from [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- USDC (mock) -- mint via MockUSDC contract
- BTN tokens -- request from admin

---

## 3. Backend API Testing

### 3.1 Health Check

```bash
curl https://bitton-backend.onrender.com/health
```

### 3.2 Auth Flow Testing

Test all three auth methods:

1. **Wallet auth**: `/auth/login/wallet/challenge` -> sign -> `/auth/login/wallet/verify`
2. **Email auth**: `/auth/register/email/init` -> OTP -> `/auth/register/email/complete`
3. **Telegram auth**: Widget -> `/auth/register/telegram/complete`

### 3.3 Dashboard API

```bash
curl https://bitton-backend.onrender.com/api/dashboard/<wallet-address>
```

---

## 4. Frontend Testing

### 4.1 Manual Test Checklist

| Page | Test |
|------|------|
| Login | All 3 auth methods work |
| Dashboard | Balance cards show correct data |
| Vault | Can activate T1/T2/T3 |
| Staking | Can stake USDC into Flex30/Boost180/Max360 |
| Rewards | Can settle with correct per-product splits |
| Vesting | Shows freeze countdown and linear release progress |
| Withdraw | Can withdraw as BTN or USDC |
| Referrals | Can copy referral link, see downline |

### 4.2 Local Development

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

---

## 5. V2 Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| BTN Token | `0x5b964baafEDf002e5364F37848DCa1908D3e4e9f` |
| USDC Token | `0x69Bc9E30366888385f68cBB566EEb655CD5A34CC` |
| VaultManager | `0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553` |
| StakingVault | `0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B` |
| RewardEngine | `0x97d1d86c709F4d5aEb93f46A60A16941c03076c0` |
| VestingPool | `0x79D2CA5fb7ACF936198ec823a006a34cB611389e` |
| WithdrawalWallet | `0xa523b6B9c3F2191C02ACfEc92C319D66315a3768` |
| BonusEngine | `0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC` |
| ReserveFund | `0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D` |
