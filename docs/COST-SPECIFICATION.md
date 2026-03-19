# BitTON.AI -- Cost Specification for Mainnet Deployment (V2)

**Date:** March 18, 2026

---

## 1. CURRENT STATE ($0 Cost)

Everything currently runs on free tiers:

| Service | Provider | Plan | Monthly Cost |
|---------|----------|------|-------------|
| Frontend hosting | Vercel | Free | $0 |
| Backend hosting | Render | Free | $0 |
| Database | Neon PostgreSQL | Free (0.5GB) | $0 |
| Blockchain RPC | Base Sepolia (public) | Free | $0 |
| Email | Resend | Free (100/day) | $0 |
| Wallet connect | WalletConnect | Free | $0 |
| **TOTAL** | | | **$0/month** |

---

## 2. MAINNET DEPLOYMENT -- ONE-TIME COSTS

### A. Security Audit (REQUIRED)

| Audit Firm | Cost | Duration |
|------------|------|----------|
| Cyfrin / CodeHawks | $15,000-30,000 | 2-4 weeks |
| Sherlock Contest | $20,000-50,000 | 2-3 weeks |
| OpenZeppelin | $40,000-60,000 | 4-6 weeks |
| Trail of Bits | $50,000-80,000 | 4-8 weeks |

### B. Smart Contract Deployment (V2 -- 9 contracts)

| Item | Gas Cost (ETH) | USD Estimate |
|------|---------------|-------------|
| BTNToken deployment | ~0.003 ETH | ~$8 |
| VaultManager (UUPS proxy + impl) | ~0.005 ETH | ~$15 |
| StakingVault (UUPS proxy + impl) | ~0.005 ETH | ~$15 |
| RewardEngine (UUPS proxy + impl) | ~0.005 ETH | ~$15 |
| VestingPool (UUPS proxy + impl) | ~0.004 ETH | ~$12 |
| WithdrawalWallet (UUPS proxy + impl) | ~0.004 ETH | ~$12 |
| BonusEngine (UUPS proxy + impl) | ~0.005 ETH | ~$15 |
| ReserveFund (UUPS proxy + impl) | ~0.004 ETH | ~$12 |
| Cross-contract wiring (9 OPERATOR grants) | ~0.003 ETH | ~$9 |
| Gnosis Safe multisig | ~0.002 ETH | ~$6 |
| TimelockController | ~0.002 ETH | ~$6 |
| **TOTAL** | **~0.042 ETH** | **~$125** |

### C. DEX Liquidity

| Pair | Minimum | Recommended |
|------|---------|-------------|
| BTN/USDC on Uniswap V3 (Base) | $5,000 | $25,000 |
| BTN/ETH on Aerodrome (Base) | $5,000 | $25,000 |
| **TOTAL** | **$10,000** | **$50,000** |

### TOTAL ONE-TIME COSTS

| Scenario | Cost |
|----------|------|
| **Budget Launch** (Cyfrin audit, minimal liquidity) | ~$25,000-45,000 |
| **Standard Launch** (OpenZeppelin audit, good liquidity) | ~$60,000-100,000 |
| **Premium Launch** (Trail of Bits, deep liquidity, legal) | ~$100,000-170,000 |

---

## 3. MONTHLY OPERATING COSTS

### Launch (0-10K active users) -- ~$50/month

| Service | Provider | Cost |
|---------|----------|------|
| Frontend | Vercel Pro | $20 |
| Backend | Render Starter | $7 |
| Database | Neon Pro | $19 |
| RPC | Alchemy Free | $0 |
| Relayer ETH | Base mainnet | ~$5 |
| **TOTAL** | | **~$51/month** |

### Growth (10K-100K users) -- ~$500/month

| Service | Provider | Cost |
|---------|----------|------|
| Frontend | Vercel Pro | $20 |
| Backend | Render Standard (2 instances) | $50 |
| Database | Neon Scale | $69 |
| RPC | Alchemy Growth | $199 |
| Email | Resend Pro | $20 |
| Redis cache | Upstash Pro | $30 |
| Monitoring | Sentry Team | $26 |
| Relayer ETH | Base mainnet | $20 |
| **TOTAL** | | **~$454/month** |

### Scale (100K-1M users) -- ~$6,000/month

| Service | Provider | Cost |
|---------|----------|------|
| Frontend | Vercel Enterprise | $500 |
| Backend | AWS ECS (4-8 containers) | $1,500 |
| Database | AWS RDS PostgreSQL (Multi-AZ) | $2,000 |
| RPC | Alchemy Enterprise | $1,000 |
| Email | SendGrid Pro | $200 |
| Redis cache | AWS ElastiCache | $300 |
| Monitoring | Datadog | $200 |
| Subgraph | The Graph | $200 |
| Relayer ETH | Base mainnet | $100 |
| **TOTAL** | | **~$6,000/month** |

---

## 4. V2 SYSTEM OVERVIEW

The V2 system has 9 contracts (7 UUPS proxies + 2 non-upgradeable tokens):

- **3 staking products**: Flex 30 (0.25%/day), Boost 180 (1.0%/day), Max 360 (0.69%/day)
- **USDC staking** (not BTN -- BTN staking gated for future)
- **Per-product dual-channel splits**: 50/50, 20/80, 15/85
- **Freeze + linear vesting**: Short (30d+60d), Long (180d+180d)
- **Dual-token withdrawal**: BTN or USDC at $2.25 platform price
- **ReserveFund**: Receives penalties (replaces burns)
- **Matching bonus**: 10 levels at 10/7/5/4/3/2/2/1/1/1%

---

*All costs are estimates based on March 2026 pricing.*
