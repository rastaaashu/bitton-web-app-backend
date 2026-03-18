# BitTON.AI -- Base Mainnet Deployment Guide

**Target Release Date:** Friday, March 20, 2026
**Network:** Base Mainnet (Chain ID: 8453)
**Prepared for:** DevOps Team

---

## Table of Contents

1. [Pre-requisites](#1-pre-requisites)
2. [Environment Setup](#2-environment-setup)
3. [Configure Hardhat for Base Mainnet](#3-configure-hardhat-for-base-mainnet)
4. [Smart Contract Deployment (ORDER MATTERS)](#4-smart-contract-deployment-order-matters)
5. [Post-Deployment Wiring (CRITICAL)](#5-post-deployment-wiring-critical)
6. [Fund Contracts](#6-fund-contracts)
7. [Contract Verification on Basescan](#7-contract-verification-on-basescan)
8. [Backend Deployment](#8-backend-deployment)
9. [Frontend Deployment](#9-frontend-deployment)
10. [Post-Deployment Verification Checklist](#10-post-deployment-verification-checklist)
11. [Security Checklist](#11-security-checklist)
12. [Product Configuration Reference](#12-product-configuration-reference)
13. [What NOT to Deploy / Enable on Day 1](#13-what-not-to-deploy--enable-on-day-1)
14. [Emergency Procedures](#14-emergency-procedures)
15. [Contract Addresses Template](#15-contract-addresses-template)
16. [Appendix: Deployment Order Diagram](#16-appendix-deployment-order-diagram)

---

## 1. Pre-requisites

Before you begin, confirm every item below is ready.

### Infrastructure

| Requirement | Details |
|-------------|---------|
| Base Mainnet RPC URL | Alchemy (`https://base-mainnet.g.alchemy.com/v2/<KEY>`) or Infura (`https://base-mainnet.infura.io/v3/<KEY>`). Free tier is fine for deployment; production backend needs a paid plan. |
| Deployer Wallet | A fresh EOA with at least **0.05 ETH on Base** for gas. Generate via `cast wallet new` or MetaMask. **Never reuse a hot wallet.** |
| Gnosis Safe Multisig | 2-of-3 recommended. Create at [safe.global](https://app.safe.global) on Base mainnet. This will become the `DEFAULT_ADMIN_ROLE` owner after deployment. |
| Basescan API Key | Get from [basescan.org/myapikey](https://basescan.org/myapikey). Required for contract verification. |

### Token Addresses (Base Mainnet)

| Token | Address | Decimals |
|-------|---------|----------|
| USDC (Circle native) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| BTN Token | To be deployed (see Step 4.1) **or** use existing address if already deployed | 6 |

### Hosting / Database

| Service | Purpose |
|---------|---------|
| PostgreSQL database | Neon (`neon.tech`) or Supabase. Must be provisioned with connection string ready. |
| Backend hosting | Render (`render.com`) or Railway (`railway.app`). Express + TypeScript server. |
| Frontend hosting | Vercel (`vercel.com`). Next.js application. |

### Repository Access

| Repo | Location | Branch |
|------|----------|--------|
| Smart Contracts | `gitlab.bitton.ai/community/bitton-staking-contracts` | `main` |
| Frontend + Backend | `github.com/rastaaashu/bitton-web-app-backend` | `main` |

### Wallets to Have Ready

| Wallet | Purpose |
|--------|---------|
| Deployer EOA | Deploys all contracts. Temporary -- admin role is transferred to multisig after deployment. |
| Treasury Wallet | Receives USDC staking principal (Boost180/Max360), vault activation fees. Should be a Gnosis Safe. |
| Gnosis Safe Multisig | Becomes `DEFAULT_ADMIN_ROLE` across all contracts after setup is complete. |

---

## 2. Environment Setup

### 2.1 Clone and Install (Contracts Repo)

```bash
git clone git@gitlab.bitton.ai:community/bitton-staking-contracts.git bitton-contracts
cd bitton-contracts
npm install
```

### 2.2 Create `.env` File

Create `.env` in the root of `bitton-contracts/`:

```env
# =============================================
#  Base Mainnet Deployment Configuration
# =============================================

# RPC
BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Deployer private key (WITH 0x prefix)
DEPLOYER_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY_HERE

# Basescan verification
BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY

# Token addresses
BTN_TOKEN_ADDRESS=            # Fill after deploying BTNToken (Step 4.1)
USDC_TOKEN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Chainlink Oracle (BTN/USD) -- leave empty if not using VaultManager with oracle
ORACLE_ADDRESS=

# Treasury wallet (Gnosis Safe or designated treasury EOA)
TREASURY_ADDRESS=0xYOUR_TREASURY_SAFE_ADDRESS

# Admin (deployer initially; will be transferred to multisig later)
ADMIN_ADDRESS=               # Fill with deployer address

# Gnosis Safe Multisig (final admin)
MULTISIG_ADDRESS=0xYOUR_GNOSIS_SAFE_ADDRESS

# Reward pool funding (BTN amount, 6 decimals, no decimal point)
# e.g., 500000 = 500,000 BTN
REWARD_FUND_AMOUNT=0
```

### 2.3 Verify `.env` is in `.gitignore`

```bash
grep ".env" .gitignore
```

If not present, add it. **Never commit private keys.**

---

## 3. Configure Hardhat for Base Mainnet

Edit `hardhat.config.js` and add the `base_mainnet` network:

```js
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

const {
  BASE_SEPOLIA_RPC_URL,
  BASE_SEPOLIA_PRIVATE_KEY,
  BASE_MAINNET_RPC_URL,
  DEPLOYER_PRIVATE_KEY,
  BASESCAN_API_KEY,
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    hardhat: {},

    // Testnet (existing)
    ...(BASE_SEPOLIA_PRIVATE_KEY ? {
      base_sepolia: {
        url: BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
        accounts: [BASE_SEPOLIA_PRIVATE_KEY],
        chainId: 84532,
      },
    } : {}),

    // MAINNET
    ...(DEPLOYER_PRIVATE_KEY ? {
      base_mainnet: {
        url: BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
        accounts: [DEPLOYER_PRIVATE_KEY],
        chainId: 8453,
        gasPrice: "auto",
      },
    } : {}),
  },
  etherscan: {
    apiKey: {
      base: BASESCAN_API_KEY,
      baseSepolia: BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};
```

### 3.1 Verify Configuration

```bash
npx hardhat compile
```

Expected: `Compiled N Solidity files successfully`. Zero errors.

---

## 4. Smart Contract Deployment (ORDER MATTERS)

**CRITICAL: Deploy contracts in exactly this order.** Each contract depends on addresses from previous deployments.

The system has two categories:

### Contracts Deployed Once (Non-Upgradeable)
- **BTNToken** -- deploy once or keep existing
- **CustodialDistribution** -- deploy once, holds the 21M BTN supply

### Contracts Deployed as UUPS Proxies (Upgradeable)
- ReserveFund
- VaultManager
- StakingVault
- WithdrawalWallet
- VestingPool
- RewardEngine
- BonusEngine

---

### Step 4.1: Deploy BTNToken (if not already deployed)

BTNToken is non-upgradeable. If already deployed on Base mainnet, skip this step and record the address.

The BTNToken constructor mints the full 21,000,000 BTN (6 decimals) to the deployer.

```bash
npx hardhat run scripts/deploy-btn-token.js --network base_mainnet
```

If no dedicated script exists, deploy via Hardhat console:

```bash
npx hardhat console --network base_mainnet
```

```js
const BTNToken = await ethers.getContractFactory("BTNToken");
const btn = await BTNToken.deploy();
await btn.waitForDeployment();
console.log("BTNToken:", await btn.getAddress());
```

Record the address:
```
BTN_TOKEN_ADDRESS=0x__________________________________________
```

Update `.env` with this address before proceeding.

---

### Step 4.2: Deploy CustodialDistribution (if not already deployed)

CustodialDistribution is non-upgradeable. It holds the master BTN supply for controlled distribution.

```bash
npx hardhat run scripts/deploy-custodial.js --network base_mainnet
```

This script reads `BTN_TOKEN_ADDRESS` from `.env` or `deployment-addresses.json`.

After deployment:
1. Transfer the desired BTN amount from deployer to CustodialDistribution
2. Record the address

```
CUSTODIAL_DISTRIBUTION_ADDRESS=0x__________________________________________
```

---

### Step 4.3: Deploy ReserveFund (UUPS Proxy)

ReserveFund receives penalty tokens (early exit penalties, early vesting unlock penalties). It has the simplest initializer.

**Initializer signature:**
```
initialize(address _admin)
```

```bash
npx hardhat console --network base_mainnet
```

```js
const ReserveFund = await ethers.getContractFactory("ReserveFund");
const reserveFund = await upgrades.deployProxy(
  ReserveFund,
  [deployer.address],   // _admin
  { kind: "uups" }
);
await reserveFund.waitForDeployment();
console.log("ReserveFund proxy:", await reserveFund.getAddress());
```

Record:
```
RESERVE_FUND_ADDRESS=0x__________________________________________
```

---

### Step 4.4: Deploy VaultManager (UUPS Proxy)

VaultManager handles vault tier activation (T1/T2/T3) with USDT or BTN payment. Uses Chainlink oracle for BTN/USD price.

**Initializer signature:**
```
initialize(
  address _btnToken,
  address _usdtToken,
  address _oracle,
  address _treasury,
  address _admin
)
```

**Note:** If no Chainlink BTN/USD feed exists on Base mainnet, pass `address(0)` for `_oracle` and users will only be able to pay vault fees in USDT. You can set the oracle later via `setOracleAddress()`.

```bash
npx hardhat run scripts/deploy-VaultManager.js --network base_mainnet
```

Or via console:

```js
const VaultManager = await ethers.getContractFactory("VaultManager");
const vaultManager = await upgrades.deployProxy(
  VaultManager,
  [
    process.env.BTN_TOKEN_ADDRESS,          // _btnToken
    process.env.USDC_TOKEN_ADDRESS,         // _usdtToken (USDC on mainnet)
    process.env.ORACLE_ADDRESS || ethers.ZeroAddress,  // _oracle
    process.env.TREASURY_ADDRESS,           // _treasury
    deployer.address,                       // _admin
  ],
  { kind: "uups" }
);
await vaultManager.waitForDeployment();
console.log("VaultManager proxy:", await vaultManager.getAddress());
```

Record:
```
VAULT_MANAGER_ADDRESS=0x__________________________________________
```

**Default tier fees set by initializer:**
- T1: $25 USDC
- T2: $50 USDC
- T3: $100 USDC

---

### Step 4.5: Deploy StakingVault (UUPS Proxy)

StakingVault is the core staking contract. Supports USDC staking (BTN staking disabled by default).

**Initializer signature:**
```
initialize(
  address _btnToken,
  address _usdcToken,
  address _treasury,
  address _reserveFund,
  address _vaultMgr,
  address _admin
)
```

```bash
npx hardhat console --network base_mainnet
```

```js
const StakingVault = await ethers.getContractFactory("StakingVault");
const stakingVault = await upgrades.deployProxy(
  StakingVault,
  [
    process.env.BTN_TOKEN_ADDRESS,      // _btnToken
    process.env.USDC_TOKEN_ADDRESS,     // _usdcToken
    process.env.TREASURY_ADDRESS,       // _treasury
    "RESERVE_FUND_ADDRESS_HERE",        // _reserveFund (from Step 4.3)
    "VAULT_MANAGER_ADDRESS_HERE",       // _vaultMgr (from Step 4.4)
    deployer.address,                   // _admin
  ],
  { kind: "uups" }
);
await stakingVault.waitForDeployment();
console.log("StakingVault proxy:", await stakingVault.getAddress());
```

Record:
```
STAKING_VAULT_ADDRESS=0x__________________________________________
```

**Defaults set by initializer:**
- `dailyRateBps[0]` = 25 (Flex30: 0.25%/day)
- `dailyRateBps[1]` = 100 (Boost180: 1.0%/day)
- `dailyRateBps[2]` = 69 (Max360: 0.69%/day)
- `btnPriceUSD` = 2,250,000 ($2.25)
- `btnStakingEnabled` = false

---

### Step 4.6: Deploy WithdrawalWallet (UUPS Proxy)

WithdrawalWallet holds user reward balances. Users can withdraw as BTN or as USDC.

**Initializer signature:**
```
initialize(
  address _btnToken,
  address _usdcToken,
  address _admin
)
```

```js
const WithdrawalWallet = await ethers.getContractFactory("WithdrawalWallet");
const withdrawalWallet = await upgrades.deployProxy(
  WithdrawalWallet,
  [
    process.env.BTN_TOKEN_ADDRESS,      // _btnToken
    process.env.USDC_TOKEN_ADDRESS,     // _usdcToken
    deployer.address,                   // _admin
  ],
  { kind: "uups" }
);
await withdrawalWallet.waitForDeployment();
console.log("WithdrawalWallet proxy:", await withdrawalWallet.getAddress());
```

Record:
```
WITHDRAWAL_WALLET_ADDRESS=0x__________________________________________
```

**Defaults set by initializer:**
- `btnPriceUSD` = 2,250,000 ($2.25)
- `weeklyWithdrawalCap` = 0 (unlimited; set a cap post-deployment)

---

### Step 4.7: Deploy VestingPool (UUPS Proxy)

VestingPool holds vested rewards with freeze + linear unlock schedules.

**Initializer signature:**
```
initialize(
  address _btnToken,
  address _withdrawalWallet,
  address _reserveFund,
  address _admin
)
```

```js
const VestingPool = await ethers.getContractFactory("VestingPool");
const vestingPool = await upgrades.deployProxy(
  VestingPool,
  [
    process.env.BTN_TOKEN_ADDRESS,          // _btnToken
    "WITHDRAWAL_WALLET_ADDRESS_HERE",       // _withdrawalWallet (from Step 4.6)
    "RESERVE_FUND_ADDRESS_HERE",            // _reserveFund (from Step 4.3)
    deployer.address,                       // _admin
  ],
  { kind: "uups" }
);
await vestingPool.waitForDeployment();
console.log("VestingPool proxy:", await vestingPool.getAddress());
```

Record:
```
VESTING_POOL_ADDRESS=0x__________________________________________
```

**Defaults set by initializer:**
- `earlyUnlockEnabled` = false (enable in ~1 month)
- `earlyUnlockPenaltyBps` = 3000 (30% penalty)

---

### Step 4.8: Deploy RewardEngine (UUPS Proxy)

RewardEngine calculates and settles staking rewards. It routes rewards to WithdrawalWallet (liquid) and VestingPool (vested).

**Initializer signature:**
```
initialize(
  address _btnToken,
  address _stakingVault,
  address _vestingPool,
  address _withdrawalWallet,
  address _vaultManager,
  address _admin
)
```

```js
const RewardEngine = await ethers.getContractFactory("RewardEngine");
const rewardEngine = await upgrades.deployProxy(
  RewardEngine,
  [
    process.env.BTN_TOKEN_ADDRESS,          // _btnToken
    "STAKING_VAULT_ADDRESS_HERE",           // _stakingVault (from Step 4.5)
    "VESTING_POOL_ADDRESS_HERE",            // _vestingPool (from Step 4.7)
    "WITHDRAWAL_WALLET_ADDRESS_HERE",       // _withdrawalWallet (from Step 4.6)
    "VAULT_MANAGER_ADDRESS_HERE",           // _vaultManager (from Step 4.4)
    deployer.address,                       // _admin
  ],
  { kind: "uups" }
);
await rewardEngine.waitForDeployment();
console.log("RewardEngine proxy:", await rewardEngine.getAddress());
```

Record:
```
REWARD_ENGINE_ADDRESS=0x__________________________________________
```

**Defaults set by initializer:**
- `liquidSplitPct[0]` = 50 (Flex30: 50% liquid / 50% vested)
- `liquidSplitPct[1]` = 20 (Boost180: 20% liquid / 80% vested)
- `liquidSplitPct[2]` = 15 (Max360: 15% liquid / 85% vested)
- `bonusLiquidPct` = 20
- `compoundingBoostBps` = 1500 (15%)

---

### Step 4.9: Deploy BonusEngine (UUPS Proxy)

BonusEngine manages referral relationships and bonus calculations (direct 5% + matching level-based).

**Initializer signature:**
```
initialize(
  address _rewardEngine,
  address _vaultManager,
  address _stakingVault,
  address _admin
)
```

```js
const BonusEngine = await ethers.getContractFactory("BonusEngine");
const bonusEngine = await upgrades.deployProxy(
  BonusEngine,
  [
    "REWARD_ENGINE_ADDRESS_HERE",           // _rewardEngine (from Step 4.8)
    "VAULT_MANAGER_ADDRESS_HERE",           // _vaultManager (from Step 4.4)
    "STAKING_VAULT_ADDRESS_HERE",           // _stakingVault (from Step 4.5)
    deployer.address,                       // _admin
  ],
  { kind: "uups" }
);
await bonusEngine.waitForDeployment();
console.log("BonusEngine proxy:", await bonusEngine.getAddress());
```

Record:
```
BONUS_ENGINE_ADDRESS=0x__________________________________________
```

---

### Alternative: Deploy All at Once

If you prefer a single script, you can use the unified deployment:

```bash
npx hardhat run scripts/deploy-all.js --network base_mainnet
```

**IMPORTANT:** Before using `deploy-all.js` on mainnet, verify the script matches the current contract initializer signatures. The individual contract initializers may have been updated since the script was written. Compare the initializer parameters in the script against the contract source code. The authoritative initializer signatures are documented in Steps 4.3 through 4.9 above.

Required `.env` variables for `deploy-all.js`:
- `BTN_TOKEN_ADDRESS` (required for non-local networks)
- `USDT_TOKEN_ADDRESS` (required for non-local networks; set to the USDC address)
- `ORACLE_ADDRESS` (required for non-local networks)
- `TREASURY_ADDRESS` (defaults to deployer if not set)
- `REWARD_FUND_AMOUNT` (optional; BTN amount to pre-fund)

The script outputs `deployment-addresses.json` with all addresses.

---

## 5. Post-Deployment Wiring (CRITICAL)

After all contracts are deployed, you must grant `OPERATOR_ROLE` so contracts can call each other. **If you skip this step, settlements, vesting, and withdrawals will all fail.**

The `OPERATOR_ROLE` hash is: `keccak256("OPERATOR_ROLE")` = `0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929`

### 5.1 Role Grants

Execute these from the deployer wallet (which has `DEFAULT_ADMIN_ROLE` on all contracts):

```js
// Connect to deployed contracts
const stakingVault = await ethers.getContractAt("StakingVault", "STAKING_VAULT_ADDRESS");
const vestingPool = await ethers.getContractAt("VestingPool", "VESTING_POOL_ADDRESS");
const withdrawalWallet = await ethers.getContractAt("WithdrawalWallet", "WITHDRAWAL_WALLET_ADDRESS");
const rewardEngine = await ethers.getContractAt("RewardEngine", "REWARD_ENGINE_ADDRESS");
const bonusEngine = await ethers.getContractAt("BonusEngine", "BONUS_ENGINE_ADDRESS");

const OPERATOR_ROLE = await rewardEngine.OPERATOR_ROLE();

// --- Grant 1: StakingVault grants OPERATOR to RewardEngine ---
// Purpose: RewardEngine calls stakingVault.resetLastRewardTime() during settlement
await (await stakingVault.grantRole(OPERATOR_ROLE, "REWARD_ENGINE_ADDRESS")).wait();
console.log("Grant 1 done: StakingVault -> RewardEngine");

// --- Grant 2: VestingPool grants OPERATOR to RewardEngine ---
// Purpose: RewardEngine calls vestingPool.addVesting() during settlement
await (await vestingPool.grantRole(OPERATOR_ROLE, "REWARD_ENGINE_ADDRESS")).wait();
console.log("Grant 2 done: VestingPool -> RewardEngine");

// --- Grant 3: WithdrawalWallet grants OPERATOR to RewardEngine ---
// Purpose: RewardEngine calls withdrawalWallet.addWithdrawable() during settlement
await (await withdrawalWallet.grantRole(OPERATOR_ROLE, "REWARD_ENGINE_ADDRESS")).wait();
console.log("Grant 3 done: WithdrawalWallet -> RewardEngine");

// --- Grant 4: WithdrawalWallet grants OPERATOR to VestingPool ---
// Purpose: VestingPool calls withdrawalWallet.addWithdrawable() during release
await (await withdrawalWallet.grantRole(OPERATOR_ROLE, "VESTING_POOL_ADDRESS")).wait();
console.log("Grant 4 done: WithdrawalWallet -> VestingPool");

// --- Grant 5: RewardEngine grants OPERATOR to BonusEngine ---
// Purpose: BonusEngine calls rewardEngine.addPendingReward() for direct/matching bonuses
await (await rewardEngine.grantRole(OPERATOR_ROLE, "BONUS_ENGINE_ADDRESS")).wait();
console.log("Grant 5 done: RewardEngine -> BonusEngine");

// --- Grant 6: BonusEngine grants OPERATOR to RewardEngine ---
// Purpose: RewardEngine calls bonusEngine.processMatchingBonus() during settlement
await (await bonusEngine.grantRole(OPERATOR_ROLE, "REWARD_ENGINE_ADDRESS")).wait();
console.log("Grant 6 done: BonusEngine -> RewardEngine");
```

### 5.2 Wire BonusEngine into RewardEngine

```js
// Tell RewardEngine where BonusEngine lives
await (await rewardEngine.setBonusEngine("BONUS_ENGINE_ADDRESS")).wait();
console.log("BonusEngine wired into RewardEngine");
```

### 5.3 Verification of Role Grants

Run these checks to confirm every grant:

```js
const OPERATOR_ROLE = await rewardEngine.OPERATOR_ROLE();

console.log("StakingVault -> RewardEngine:", await stakingVault.hasRole(OPERATOR_ROLE, "REWARD_ENGINE_ADDRESS"));
console.log("VestingPool -> RewardEngine:", await vestingPool.hasRole(OPERATOR_ROLE, "REWARD_ENGINE_ADDRESS"));
console.log("WithdrawalWallet -> RewardEngine:", await withdrawalWallet.hasRole(OPERATOR_ROLE, "REWARD_ENGINE_ADDRESS"));
console.log("WithdrawalWallet -> VestingPool:", await withdrawalWallet.hasRole(OPERATOR_ROLE, "VESTING_POOL_ADDRESS"));
console.log("RewardEngine -> BonusEngine:", await rewardEngine.hasRole(OPERATOR_ROLE, "BONUS_ENGINE_ADDRESS"));
console.log("BonusEngine -> RewardEngine:", await bonusEngine.hasRole(OPERATOR_ROLE, "REWARD_ENGINE_ADDRESS"));
console.log("RewardEngine.bonusEngine:", await rewardEngine.bonusEngine());
```

**All should return `true`. If any returns `false`, the system will fail at runtime.**

### Wiring Summary Diagram

```
StakingVault
  |-- OPERATOR_ROLE --> RewardEngine    (resetLastRewardTime)

VestingPool
  |-- OPERATOR_ROLE --> RewardEngine    (addVesting)

WithdrawalWallet
  |-- OPERATOR_ROLE --> RewardEngine    (addWithdrawable)
  |-- OPERATOR_ROLE --> VestingPool     (addWithdrawable on release)

RewardEngine
  |-- OPERATOR_ROLE --> BonusEngine     (addPendingReward)
  |-- setBonusEngine(BonusEngine)       (address wired)

BonusEngine
  |-- OPERATOR_ROLE --> RewardEngine    (processMatchingBonus)
```

---

## 6. Fund Contracts

### 6.1 Fund RewardEngine with BTN

The RewardEngine pays rewards from a pre-funded BTN balance. **No minting occurs -- all rewards come from this pool.**

**Recommended initial funding: at least 2 weeks of estimated rewards.**

Example: Fund with 100,000 BTN (= 100,000,000,000 in raw 6-decimal units):

```js
const btnToken = await ethers.getContractAt("IERC20", "BTN_TOKEN_ADDRESS");
const rewardEngine = await ethers.getContractAt("RewardEngine", "REWARD_ENGINE_ADDRESS");

const amount = ethers.parseUnits("100000", 6);  // 100,000 BTN

// Step 1: Approve RewardEngine to spend BTN
await (await btnToken.approve("REWARD_ENGINE_ADDRESS", amount)).wait();
console.log("Approved");

// Step 2: Fund the reward pool
await (await rewardEngine.fundRewards(amount)).wait();
console.log("RewardEngine funded");

// Step 3: Verify
const pool = await rewardEngine.rewardPoolBalance();
console.log("Reward pool balance:", ethers.formatUnits(pool, 6), "BTN");
```

**Alternative:** Use CustodialDistribution to fund:
```js
const custodial = await ethers.getContractAt("CustodialDistribution", "CUSTODIAL_ADDRESS");
// First, fund from CustodialDistribution to deployer
await (await custodial.fundContract("REWARD_ENGINE_PROXY_ADDRESS", amount)).wait();
// Note: This sends BTN directly. You may need to call fundRewards separately
// depending on whether the BTN goes to the contract directly or via approve+transfer.
```

For the `fundRewards` flow, BTN must be in the caller's wallet and approved. The simplest approach:
1. CustodialDistribution `distribute()` BTN to deployer
2. Deployer `approve()` + `fundRewards()` on RewardEngine

### 6.2 Fund WithdrawalWallet with USDC

Users can withdraw rewards as USDC. The WithdrawalWallet must hold USDC reserves for this.

```js
const usdc = await ethers.getContractAt("IERC20", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const withdrawalWallet = await ethers.getContractAt("WithdrawalWallet", "WITHDRAWAL_WALLET_ADDRESS");

const usdcAmount = ethers.parseUnits("50000", 6);  // 50,000 USDC

// Step 1: Approve
await (await usdc.approve("WITHDRAWAL_WALLET_ADDRESS", usdcAmount)).wait();

// Step 2: Fund
await (await withdrawalWallet.fundUSDC(usdcAmount)).wait();

// Step 3: Verify
const reserve = await withdrawalWallet.getUSDCReserve();
console.log("USDC reserve:", ethers.formatUnits(reserve, 6), "USDC");
```

### 6.3 Funding Estimates

| What | Minimum | Recommended |
|------|---------|-------------|
| RewardEngine (BTN) | 1 week of projected rewards | 2-4 weeks of projected rewards |
| WithdrawalWallet (USDC) | 1 week of projected withdrawals | 2 weeks of projected withdrawals |
| Deployer ETH (gas) | 0.02 ETH | 0.05 ETH |

**Monitor balances weekly.** The RewardEngine will revert with `InsufficientRewardPool` if the pool runs dry during settlement.

---

## 7. Contract Verification on Basescan

Verified contracts display source code on Basescan and allow users to interact directly.

### 7.1 Verify UUPS Proxy Contracts

For UUPS proxies, verify the **implementation** contract (Basescan auto-links proxy to implementation).

```bash
# Verify each implementation via Hardhat
npx hardhat verify --network base_mainnet IMPLEMENTATION_ADDRESS
```

To get the implementation address for a proxy:

```js
const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const provider = ethers.provider;

const implAddr = await getImplementationAddress(provider, "PROXY_ADDRESS");
console.log("Implementation:", implAddr);
```

### 7.2 Verify Non-Upgradeable Contracts

```bash
# BTNToken (no constructor args)
npx hardhat verify --network base_mainnet BTN_TOKEN_ADDRESS

# CustodialDistribution (constructor args: _btnToken, _admin)
npx hardhat verify --network base_mainnet CUSTODIAL_ADDRESS "BTN_TOKEN_ADDRESS" "DEPLOYER_ADDRESS"
```

### 7.3 Verify All Implementations (Batch)

Run for each UUPS proxy:

```bash
npx hardhat verify --network base_mainnet $(cast implementation RESERVE_FUND_PROXY)
npx hardhat verify --network base_mainnet $(cast implementation VAULT_MANAGER_PROXY)
npx hardhat verify --network base_mainnet $(cast implementation STAKING_VAULT_PROXY)
npx hardhat verify --network base_mainnet $(cast implementation WITHDRAWAL_WALLET_PROXY)
npx hardhat verify --network base_mainnet $(cast implementation VESTING_POOL_PROXY)
npx hardhat verify --network base_mainnet $(cast implementation REWARD_ENGINE_PROXY)
npx hardhat verify --network base_mainnet $(cast implementation BONUS_ENGINE_PROXY)
```

### 7.4 Confirm on Basescan

Visit each proxy address on [basescan.org](https://basescan.org). You should see:
- "Read as Proxy" and "Write as Proxy" tabs
- Full source code visible
- "This contract is a proxy and the implementation is verified"

---

## 8. Backend Deployment

The backend is an Express + TypeScript server in the `bitton-web-app-backend` repo at `/backend`.

### 8.1 Environment Variables

Create or update the `.env` for the backend service. **Every variable listed below is required for mainnet.**

```env
# =============================================
#  BitTON.AI Backend -- Production Configuration
# =============================================

# --- Server ---
NODE_ENV=production
PORT=3001

# --- Database ---
DATABASE_URL=postgresql://user:password@host:5432/bitton_prod?sslmode=require

# --- Base Mainnet RPC ---
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CHAIN_ID=8453

# --- Operator Wallet (for settlement transactions) ---
# This wallet needs ETH on Base for gas and OPERATOR_ROLE on relevant contracts
OPERATOR_PRIVATE_KEY=0xYOUR_OPERATOR_WALLET_PRIVATE_KEY

# --- Token Addresses ---
BTN_TOKEN_ADDRESS=0x__________________________________________
USDC_TOKEN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# --- Contract Addresses (fill from deployment) ---
VAULT_MANAGER_ADDRESS=0x__________________________________________
STAKING_VAULT_ADDRESS=0x__________________________________________
WITHDRAWAL_WALLET_ADDRESS=0x__________________________________________
VESTING_POOL_ADDRESS=0x__________________________________________
REWARD_ENGINE_ADDRESS=0x__________________________________________
BONUS_ENGINE_ADDRESS=0x__________________________________________
RESERVE_FUND_ADDRESS=0x__________________________________________
CUSTODIAL_DISTRIBUTION_ADDRESS=0x__________________________________________

# --- BTN Platform Price ---
BTN_PRICE_USD=2.25

# --- Auth / JWT ---
JWT_SECRET=GENERATE_A_STRONG_RANDOM_SECRET_HERE
JWT_EXPIRY=7d

# --- Frontend URL (CORS) ---
FRONTEND_URL=https://app.bitton.ai

# --- Telegram Bot (if applicable) ---
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
```

### 8.2 Database Migration

```bash
cd backend
npx prisma migrate deploy
```

This applies all pending migrations to the production database. **Never run `prisma migrate dev` in production.**

### 8.3 Deploy to Render / Railway

**Render:**
1. Create a new Web Service
2. Connect the `github.com/rastaaashu/bitton-web-app-backend` repo
3. Set root directory to `backend`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add all environment variables from Section 8.1
7. Set auto-deploy branch to `main`

**Railway:**
1. Create a new project from GitHub repo
2. Set root directory to `backend`
3. Add all environment variables
4. Railway auto-detects build and start commands

### 8.4 Verify Backend is Running

```bash
curl https://api.bitton.ai/health
# Expected: {"status":"ok","chain":"base","chainId":8453}
```

---

## 9. Frontend Deployment

The frontend is a Next.js application in the `bitton-web-app-backend` repo at `/frontend`.

### 9.1 Update Contract Addresses

Edit `frontend/src/config/contracts.ts` (or equivalent config file) with all mainnet addresses:

```ts
export const CONTRACTS = {
  BTN_TOKEN: "0x__________________________________________",
  USDC_TOKEN: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  VAULT_MANAGER: "0x__________________________________________",
  STAKING_VAULT: "0x__________________________________________",
  WITHDRAWAL_WALLET: "0x__________________________________________",
  VESTING_POOL: "0x__________________________________________",
  REWARD_ENGINE: "0x__________________________________________",
  BONUS_ENGINE: "0x__________________________________________",
};
```

### 9.2 Update Wagmi / Chain Configuration

Ensure the wagmi config uses Base mainnet as the primary (or only) chain:

```ts
import { base } from "wagmi/chains";

// Ensure Base mainnet is the primary chain
// Remove or deprioritize base_sepolia for production
export const chains = [base];
```

### 9.3 Environment Variables (Vercel)

Set these in Vercel project settings > Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://api.bitton.ai
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_BTN_TOKEN=0x__________________________________________
NEXT_PUBLIC_USDC_TOKEN=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_VAULT_MANAGER=0x__________________________________________
NEXT_PUBLIC_STAKING_VAULT=0x__________________________________________
NEXT_PUBLIC_WITHDRAWAL_WALLET=0x__________________________________________
NEXT_PUBLIC_VESTING_POOL=0x__________________________________________
NEXT_PUBLIC_REWARD_ENGINE=0x__________________________________________
NEXT_PUBLIC_BONUS_ENGINE=0x__________________________________________
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_ID
```

### 9.4 Deploy to Vercel

1. Connect the `github.com/rastaaashu/bitton-web-app-backend` repo to Vercel
2. Set root directory to `frontend`
3. Framework preset: Next.js
4. Add all environment variables from Section 9.3
5. Deploy
6. Set custom domain: `app.bitton.ai`

### 9.5 Verify Frontend

1. Visit `https://app.bitton.ai`
2. Connect wallet (MetaMask / WalletConnect)
3. Confirm it connects to Base mainnet (Chain ID 8453)
4. Confirm contract addresses appear correctly in the UI

---

## 10. Post-Deployment Verification Checklist

Run through every item. **Do not declare launch-ready until all boxes are checked.**

### Contracts

- [ ] All 9 contracts deployed (BTNToken, CustodialDistribution, ReserveFund, VaultManager, StakingVault, WithdrawalWallet, VestingPool, RewardEngine, BonusEngine)
- [ ] All UUPS proxy contracts verified on Basescan (source code visible)
- [ ] BTNToken and CustodialDistribution verified on Basescan
- [ ] All 6 OPERATOR_ROLE grants confirmed (Section 5.3 verification all return `true`)
- [ ] `rewardEngine.bonusEngine()` returns the BonusEngine address

### Funding

- [ ] RewardEngine funded with BTN (check `rewardEngine.rewardPoolBalance()`)
- [ ] WithdrawalWallet funded with USDC (check `withdrawalWallet.getUSDCReserve()`)
- [ ] Deployer wallet still has enough ETH for any post-deployment transactions

### Configuration

- [ ] `stakingVault.btnStakingEnabled()` returns `false` (BTN staking disabled for Day 1)
- [ ] `vestingPool.earlyUnlockEnabled()` returns `false` (early unlock disabled for Day 1)
- [ ] `stakingVault.btnPriceUSD()` returns `2250000` ($2.25)
- [ ] `withdrawalWallet.btnPriceUSD()` returns `2250000` ($2.25)
- [ ] `stakingVault.dailyRateBps(0)` returns `25` (Flex30: 0.25%/day)
- [ ] `stakingVault.dailyRateBps(1)` returns `100` (Boost180: 1.0%/day)
- [ ] `stakingVault.dailyRateBps(2)` returns `69` (Max360: 0.69%/day)
- [ ] `withdrawalWallet.weeklyWithdrawalCap()` is set to desired cap (or 0 for unlimited)

### End-to-End Smoke Test

Perform these with a small amount from a test wallet:

- [ ] Activate vault (T1) by approving and paying USDC via `vaultManager.activateVault(1)`
- [ ] Stake 10 USDC into Flex30 (product type 0) via `stakingVault.stakeUSDC(10000000, 0)`
- [ ] Stake 10 USDC into Boost180 (product type 1) via `stakingVault.stakeUSDC(10000000, 1)`
- [ ] Stake 10 USDC into Max360 (product type 2) via `stakingVault.stakeUSDC(10000000, 2)`
- [ ] Wait a few minutes, then settle via `rewardEngine.settleWeekly(userAddress)` -- confirm no revert
- [ ] Check `withdrawalWallet.getWithdrawableBalance(userAddress)` shows liquid portion
- [ ] Check `vestingPool.getVestedBalance(userAddress)` shows vested portion
- [ ] Withdraw BTN via `withdrawalWallet.withdrawAsBTN(amount)` -- confirm BTN received
- [ ] Withdraw USDC via `withdrawalWallet.withdrawAsUSDC(btnAmount)` -- confirm USDC received
- [ ] Verify admin can change daily rates via `stakingVault.setDailyRateBps(0, 30)` then revert back

### Frontend + Backend

- [ ] Frontend loads and connects to Base mainnet
- [ ] Users can activate vault through the UI
- [ ] Users can stake USDC through the UI
- [ ] Dashboard shows correct staking positions
- [ ] Settlement works through the backend operator
- [ ] Withdrawal flow works through the UI

---

## 11. Security Checklist

### 11.1 Transfer Admin to Multisig

After all deployment and wiring is verified, transfer `DEFAULT_ADMIN_ROLE` from the deployer to the Gnosis Safe multisig. **This is the most important security step.**

```js
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const MULTISIG = "0xYOUR_GNOSIS_SAFE_ADDRESS";

// For each contract, grant admin to multisig, then revoke deployer's admin
const contracts = [
  await ethers.getContractAt("ReserveFund", "RESERVE_FUND_ADDRESS"),
  await ethers.getContractAt("VaultManager", "VAULT_MANAGER_ADDRESS"),
  await ethers.getContractAt("StakingVault", "STAKING_VAULT_ADDRESS"),
  await ethers.getContractAt("WithdrawalWallet", "WITHDRAWAL_WALLET_ADDRESS"),
  await ethers.getContractAt("VestingPool", "VESTING_POOL_ADDRESS"),
  await ethers.getContractAt("RewardEngine", "REWARD_ENGINE_ADDRESS"),
  await ethers.getContractAt("BonusEngine", "BONUS_ENGINE_ADDRESS"),
];

for (const contract of contracts) {
  const addr = await contract.getAddress();

  // Grant admin to multisig
  await (await contract.grantRole(DEFAULT_ADMIN_ROLE, MULTISIG)).wait();
  console.log(`Granted DEFAULT_ADMIN_ROLE to multisig on ${addr}`);

  // Revoke deployer's admin
  await (await contract.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address)).wait();
  console.log(`Revoked DEFAULT_ADMIN_ROLE from deployer on ${addr}`);
}
```

**For BTNToken** (uses Ownable, not AccessControl):
```js
const btn = await ethers.getContractAt("BTNToken", "BTN_TOKEN_ADDRESS");
await (await btn.transferOwnership(MULTISIG)).wait();
console.log("BTNToken ownership transferred to multisig");
```

**For CustodialDistribution** (uses AccessControl):
```js
const custodial = await ethers.getContractAt("CustodialDistribution", "CUSTODIAL_ADDRESS");
await (await custodial.grantRole(DEFAULT_ADMIN_ROLE, MULTISIG)).wait();
await (await custodial.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address)).wait();
```

### 11.2 Verify Admin Transfer

```js
for (const contract of contracts) {
  const addr = await contract.getAddress();
  const deployerIsAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  const multisigIsAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, MULTISIG);
  console.log(`${addr}: deployer=${deployerIsAdmin}, multisig=${multisigIsAdmin}`);
}
// Expected: deployer=false, multisig=true for ALL contracts
```

### 11.3 Grant EMERGENCY_ROLE to Multisig

The `EMERGENCY_ROLE` can pause contracts. Make sure the multisig has it:

```js
const EMERGENCY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EMERGENCY_ROLE"));

// Grant EMERGENCY_ROLE to multisig on all pausable contracts
// (This should be done from the multisig, since deployer no longer has admin)
```

### 11.4 Security Checklist

- [ ] `DEFAULT_ADMIN_ROLE` transferred to multisig on all 7 UUPS contracts
- [ ] `DEFAULT_ADMIN_ROLE` revoked from deployer on all 7 UUPS contracts
- [ ] BTNToken ownership transferred to multisig
- [ ] CustodialDistribution admin transferred to multisig
- [ ] Deployer private key secured (ideally destroyed if not needed)
- [ ] Operator wallet private key stored securely (needed for backend settlement)
- [ ] All contracts are pausable (verified)
- [ ] Weekly withdrawal cap set on WithdrawalWallet (prevents bank run)
- [ ] No contracts hold unnecessary token approvals
- [ ] Backend `.env` file is not committed to git
- [ ] RPC URL and API keys are in environment variables, not hardcoded

---

## 12. Product Configuration Reference

### Staking Products

| Product | Type ID | Lock Period | Daily Rate | Basis Points | Liquid/Vested Split | Vesting Schedule | Principal on Unstake |
|---------|---------|-------------|-----------|-------------|---------------------|-----------------|---------------------|
| Flex 30 | 0 | 30 days | 0.25%/day | 25 bps | 50% liquid / 50% vested | 30d freeze + 60d linear | Returned to user |
| Boost 180 | 1 | 180 days | 1.0%/day | 100 bps | 20% liquid / 80% vested | 180d freeze + 180d linear | Sent to treasury |
| Max 360 | 2 | 360 days | 0.69%/day | 69 bps | 15% liquid / 85% vested | 180d freeze + 180d linear | Sent to treasury |

### BTN Platform Price

| Parameter | Value | Raw (6 decimals) |
|-----------|-------|-------------------|
| BTN Price USD | $2.25 | 2,250,000 |

Set in both `StakingVault.btnPriceUSD` and `WithdrawalWallet.btnPriceUSD`. **Keep these in sync.**

### Vault Activation Tiers

| Tier | Fee (USD) | Matching Depth | Raw Fee (6 decimals) |
|------|-----------|----------------|---------------------|
| T1 | $25 | 3 levels | 25,000,000 |
| T2 | $50 | 5 levels | 50,000,000 |
| T3 | $100 | 10 levels | 100,000,000 |

### Matching Bonus Percentages

| Level | Percentage | Basis Points |
|-------|-----------|-------------|
| L1 | 10% | 1000 |
| L2 | 5% | 500 |
| L3 | 3% | 300 |
| L4-L10 | 1% each | 100 each |

### Direct Bonus

| Parameter | Value |
|-----------|-------|
| Rate | 5% of referred user's stake amount |
| Basis Points | 500 |
| Min Personal Stake (for matching) | 500 BTN |

### Penalties

| Penalty | Default | Basis Points |
|---------|---------|-------------|
| Early exit (Flex30 before 30d lock) | 15% | 1500 |
| Early vesting unlock | 30% | 3000 |

Penalties are sent to the **ReserveFund** contract.

---

## 13. What NOT to Deploy / Enable on Day 1

These features are deliberately disabled at launch. Enable them approximately 1 month after launch when the system is stable.

| Feature | Default State | How to Enable | When to Enable |
|---------|--------------|---------------|----------------|
| BTN Staking | `btnStakingEnabled = false` | `stakingVault.setBtnStakingEnabled(true)` | ~1 month post-launch |
| Early Vesting Unlock | `earlyUnlockEnabled = false` | `vestingPool.setEarlyUnlockEnabled(true)` | ~1 month post-launch |
| Compounding Boost | Per-user, operator-managed | `rewardEngine.setCompoundingBoost(user, true)` | When ready |
| BTN Payment for Vault | Requires oracle | Set oracle via `vaultManager.setOracleAddress(addr)` | When Chainlink feed available |

**On Day 1, users can only:**
- Pay vault activation fees in USDC
- Stake USDC (not BTN)
- Receive rewards in BTN (liquid) or accumulate in vesting
- Withdraw as BTN or USDC

---

## 14. Emergency Procedures

### 14.1 Pause All Contracts

If something goes wrong, pause every contract. Any address with `EMERGENCY_ROLE` can pause.

```js
// From multisig or emergency wallet:
await stakingVault.pause();
await rewardEngine.pause();
await withdrawalWallet.pause();
await vestingPool.pause();
await vaultManager.pause();
await bonusEngine.pause();
await reserveFund.pause();
```

**When paused:**
- No new stakes
- No settlements
- No withdrawals
- No vault activations
- No vesting releases
- Existing positions are safe (nothing is lost)

### 14.2 Unpause Contracts

Only `DEFAULT_ADMIN_ROLE` (multisig) can unpause:

```js
// From multisig:
await stakingVault.unpause();
await rewardEngine.unpause();
await withdrawalWallet.unpause();
await vestingPool.unpause();
await vaultManager.unpause();
await bonusEngine.unpause();
await reserveFund.unpause();
```

### 14.3 Emergency Contact Chain

| Priority | Contact | Responsibility |
|----------|---------|---------------|
| 1 | Lead Dev | Smart contract triage, determine if pause needed |
| 2 | DevOps Lead | Execute pause via multisig, coordinate infrastructure |
| 3 | Multisig Signers | 2-of-3 approval for any admin action |
| 4 | Project Lead | Communications, user notifications |

### 14.4 Common Emergency Scenarios

**Scenario: RewardEngine runs out of BTN**
- Symptom: `settleWeekly()` reverts with `InsufficientRewardPool`
- Fix: Fund RewardEngine with more BTN via `fundRewards(amount)` -- does NOT require pause
- Prevention: Set up monitoring on `rewardPoolBalance` with alerts at 20% remaining

**Scenario: WithdrawalWallet runs out of USDC**
- Symptom: `withdrawAsUSDC()` reverts with `InsufficientUSDCReserve`
- Fix: Fund with more USDC via `fundUSDC(amount)` -- does NOT require pause
- Note: Users can still withdraw as BTN

**Scenario: Suspicious activity / possible exploit**
- Action: Immediately pause ALL contracts
- Then: Investigate, consult security team
- Only unpause after root cause identified and fixed

**Scenario: Need to upgrade a contract**
- UUPS contracts can be upgraded by `DEFAULT_ADMIN_ROLE` (multisig)
- Deploy new implementation, then call `upgradeToAndCall(newImpl, data)` via proxy
- Test upgrade on testnet fork first

---

## 15. Contract Addresses Template

Fill this table after deployment. **Keep a copy in a secure location (not just `.env`).**

### Base Mainnet Deployment -- March 20, 2026

| Contract | Type | Proxy Address | Implementation Address | Verified |
|----------|------|---------------|----------------------|----------|
| BTNToken | Non-upgradeable | N/A | `0x` | [ ] |
| CustodialDistribution | Non-upgradeable | N/A | `0x` | [ ] |
| ReserveFund | UUPS Proxy | `0x` | `0x` | [ ] |
| VaultManager | UUPS Proxy | `0x` | `0x` | [ ] |
| StakingVault | UUPS Proxy | `0x` | `0x` | [ ] |
| WithdrawalWallet | UUPS Proxy | `0x` | `0x` | [ ] |
| VestingPool | UUPS Proxy | `0x` | `0x` | [ ] |
| RewardEngine | UUPS Proxy | `0x` | `0x` | [ ] |
| BonusEngine | UUPS Proxy | `0x` | `0x` | [ ] |

### External Addresses

| Address | Value |
|---------|-------|
| USDC (Base Mainnet) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Treasury Wallet | `0x` |
| Gnosis Safe Multisig | `0x` |
| Deployer (temporary) | `0x` |
| Operator (backend) | `0x` |
| Chainlink Oracle | `0x` (or N/A if not set) |

### Role Grants Confirmed

| Contract | Grantee | Role | Confirmed |
|----------|---------|------|-----------|
| StakingVault | RewardEngine | OPERATOR_ROLE | [ ] |
| VestingPool | RewardEngine | OPERATOR_ROLE | [ ] |
| WithdrawalWallet | RewardEngine | OPERATOR_ROLE | [ ] |
| WithdrawalWallet | VestingPool | OPERATOR_ROLE | [ ] |
| RewardEngine | BonusEngine | OPERATOR_ROLE | [ ] |
| BonusEngine | RewardEngine | OPERATOR_ROLE | [ ] |
| RewardEngine | setBonusEngine() | Address wired | [ ] |

### Admin Transfer Confirmed

| Contract | Deployer Admin Revoked | Multisig Admin Granted |
|----------|----------------------|----------------------|
| ReserveFund | [ ] | [ ] |
| VaultManager | [ ] | [ ] |
| StakingVault | [ ] | [ ] |
| WithdrawalWallet | [ ] | [ ] |
| VestingPool | [ ] | [ ] |
| RewardEngine | [ ] | [ ] |
| BonusEngine | [ ] | [ ] |
| BTNToken (ownership) | [ ] | [ ] |
| CustodialDistribution | [ ] | [ ] |

---

## 16. Appendix: Deployment Order Diagram

```
Phase 1: Token + Treasury (deploy first, no dependencies)
  BTNToken ..................... non-upgradeable, mints 21M to deployer
  CustodialDistribution ....... non-upgradeable, holds BTN supply
  ReserveFund ................. UUPS, receives penalties

Phase 2: Vault Management (depends on BTN + USDC addresses)
  VaultManager ................ UUPS, tier activation
    needs: btnToken, usdcToken, oracle, treasury, admin

Phase 3: Core Staking (depends on Phase 1 + 2)
  StakingVault ................ UUPS, staking positions
    needs: btnToken, usdcToken, treasury, reserveFund, vaultManager, admin

Phase 4: Withdrawal + Vesting (depends on Phase 1)
  WithdrawalWallet ............ UUPS, user reward balances
    needs: btnToken, usdcToken, admin
  VestingPool ................. UUPS, vesting schedules
    needs: btnToken, withdrawalWallet, reserveFund, admin

Phase 5: Reward Settlement (depends on Phase 3 + 4)
  RewardEngine ................ UUPS, calculates + distributes rewards
    needs: btnToken, stakingVault, vestingPool, withdrawalWallet, vaultManager, admin

Phase 6: Bonus System (depends on Phase 5)
  BonusEngine ................. UUPS, referral bonuses
    needs: rewardEngine, vaultManager, stakingVault, admin

Phase 7: Wiring
  Grant OPERATOR_ROLE across contracts (6 grants)
  Wire BonusEngine address into RewardEngine

Phase 8: Funding
  Fund RewardEngine with BTN
  Fund WithdrawalWallet with USDC

Phase 9: Security Hardening
  Transfer DEFAULT_ADMIN_ROLE to multisig
  Revoke deployer's admin role
  Set weekly withdrawal caps

Phase 10: Frontend + Backend
  Deploy backend with all contract addresses
  Deploy frontend pointing to mainnet
```

---

**END OF DEPLOYMENT GUIDE**

*Last updated: March 18, 2026*
*Author: BitTON.AI Engineering Team*
