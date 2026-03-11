# BitTON.AI — Cost Specification for Mainnet Deployment

**Date:** March 10, 2026
**Prepared for:** Stakeholder Review

---

## 1. CURRENT STATE (What We Have — $0 Cost)

Everything currently runs on free tiers:

| Service | Provider | Plan | Monthly Cost |
|---------|----------|------|-------------|
| Frontend hosting | Vercel | Free | $0 |
| Backend hosting | Render | Free | $0 |
| Database | Neon PostgreSQL | Free (0.5GB) | $0 |
| Blockchain RPC | Base Sepolia (public) | Free | $0 |
| Email (broken) | Resend | Free (100/day) | $0 |
| Wallet connect | WalletConnect | Free | $0 |
| Domain | — | Not purchased | $0 |
| **TOTAL** | | | **$0/month** |

---

## 2. IMMEDIATE FIXES (To Get Demo Working — $0-7/month)

| Fix | Action | Cost | Time |
|-----|--------|------|------|
| Backend sleeping | Wake Render service OR upgrade to Starter | $0 or $7/mo | 5 min |
| Email not sending | Get Resend API key (free: 100 emails/day) | $0 | 30 min |
| **TOTAL** | | **$0-7/month** | **35 min** |

---

## 3. MAINNET DEPLOYMENT — ONE-TIME COSTS

### A. Security Audit (REQUIRED — Cannot Skip)

| Audit Firm | Cost | Duration | Reputation |
|------------|------|----------|------------|
| **Cyfrin / CodeHawks** | $15,000-30,000 | 2-4 weeks | Good, emerging |
| **Sherlock Contest** | $20,000-50,000 | 2-3 weeks | Crowdsourced, thorough |
| **OpenZeppelin** | $40,000-60,000 | 4-6 weeks | Industry gold standard |
| **Trail of Bits** | $50,000-80,000 | 4-8 weeks | Top tier |

**Recommendation:** Start with Cyfrin ($15K-30K) for budget-conscious launch, then do OpenZeppelin ($40K+) audit later as revenue grows.

### B. Smart Contract Deployment to Base Mainnet

| Item | Gas Cost (ETH) | USD Estimate |
|------|---------------|-------------|
| BTNToken deployment | ~0.003 ETH | ~$8 |
| VaultManager (UUPS proxy + impl) | ~0.005 ETH | ~$15 |
| StakingVault (UUPS proxy + impl) | ~0.005 ETH | ~$15 |
| RewardEngine (UUPS proxy + impl) | ~0.005 ETH | ~$15 |
| VestingPool (UUPS proxy + impl) | ~0.004 ETH | ~$12 |
| WithdrawalWallet (UUPS proxy + impl) | ~0.004 ETH | ~$12 |
| BonusEngine (UUPS proxy + impl) | ~0.005 ETH | ~$15 |
| CustodialDistribution | ~0.004 ETH | ~$12 |
| Cross-contract wiring (OPERATOR grants) | ~0.002 ETH | ~$6 |
| Gnosis Safe multisig | ~0.002 ETH | ~$6 |
| TimelockController | ~0.002 ETH | ~$6 |
| **TOTAL** | **~0.041 ETH** | **~$120** |

### C. DEX Liquidity

| Pair | Minimum | Recommended |
|------|---------|-------------|
| BTN/USDC on Uniswap V3 (Base) | $5,000 | $25,000 |
| BTN/ETH on Aerodrome (Base) | $5,000 | $25,000 |
| **TOTAL** | **$10,000** | **$50,000** |

### D. Other One-Time Costs

| Item | Cost |
|------|------|
| Domain (bitton.ai) | $15-50/year |
| SSL Certificate | $0 (included with Vercel/Cloudflare) |
| Legal/compliance review | $5,000-20,000 |
| Bug bounty setup (Immunefi) | $0 setup + rewards pool |
| **TOTAL** | **$5,000-20,000** |

### TOTAL ONE-TIME COSTS

| Scenario | Cost |
|----------|------|
| **Budget Launch** (Cyfrin audit, minimal liquidity) | ~$30,000-45,000 |
| **Standard Launch** (OpenZeppelin audit, good liquidity) | ~$60,000-100,000 |
| **Premium Launch** (Trail of Bits, deep liquidity, legal) | ~$100,000-170,000 |

---

## 4. MONTHLY OPERATING COSTS AFTER MAINNET

### Tier 1: Launch (0-10K active users) — ~$200/month

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Frontend | Vercel Pro | Pro | $20 |
| Backend | Render Starter | 1 instance | $7 |
| Database | Neon Pro | 10GB | $19 |
| RPC | Alchemy | Free tier (3M compute) | $0 |
| Email | Resend | Free (100/day) | $0 |
| Redis cache | Upstash | Free (10K/day) | $0 |
| Monitoring | Sentry | Free (5K events) | $0 |
| Domain | Cloudflare | Free DNS | $0 |
| Relayer ETH | Base mainnet | ~$5/month gas | $5 |
| **TOTAL** | | | **~$51/month** |

### Tier 2: Growth (10K-100K users) — ~$500/month

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Frontend | Vercel Pro | Pro | $20 |
| Backend | Render Standard | 2 instances | $50 |
| Database | Neon Scale | 50GB + pooling | $69 |
| RPC | Alchemy Growth | 300M compute | $199 |
| Email | Resend Pro | 50K/month | $20 |
| Redis cache | Upstash Pro | 100K/day | $30 |
| Monitoring | Sentry Team | 50K events | $26 |
| Relayer ETH | Base mainnet | ~$20/month | $20 |
| **TOTAL** | | | **~$454/month** |

### Tier 3: Scale (100K-1M users) — ~$5,000/month

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Frontend | Vercel Enterprise | Enterprise | $500 |
| Backend | AWS ECS | 4-8 containers | $1,500 |
| Database | AWS RDS PostgreSQL | Multi-AZ | $2,000 |
| RPC | Alchemy Enterprise | Dedicated | $1,000 |
| Email | SendGrid Pro | 1M/month | $200 |
| Redis cache | AWS ElastiCache | Cluster | $300 |
| Monitoring | Datadog | Full APM | $200 |
| Subgraph | The Graph | Hosted | $200 |
| Relayer ETH | Base mainnet | ~$100/month | $100 |
| **TOTAL** | | | **~$6,000/month** |

---

## 5. FEATURE-BY-FEATURE COST TO FIX/IMPLEMENT

### Currently Broken Features

| Feature | Issue | Fix Cost | Monthly Cost | Dev Time |
|---------|-------|----------|-------------|----------|
| Email delivery | No API key | $0 | $0-20/mo | 30 min |
| Backend uptime | Free tier sleeps | $0 | $7/mo | 5 min |
| TON signature verify | Not implemented | $0 | $0 | 4 hours |
| **Subtotal** | | **$0** | **$7-27/mo** | **4.5 hours** |

### Performance Improvements

| Feature | Issue | Fix Cost | Dev Time |
|---------|-------|----------|----------|
| Redis caching layer | No cache, repeated RPC calls | $0 (Upstash free) | 8 hours |
| N+1 query fix (history) | Sequential RPC calls | $0 | 4 hours |
| Frontend code splitting | Large bundles | $0 | 4 hours |
| Error boundaries | App crashes show blank | $0 | 2 hours |
| Toast notifications | Inline errors only | $0 | 2 hours |
| Network change detection | No chain switch prompt | $0 | 2 hours |
| **Subtotal** | | **$0** | **22 hours** |

### Production Readiness

| Feature | Cost | Dev Time |
|---------|------|----------|
| Gnosis Safe multisig setup | $6 gas | 2 hours |
| TimelockController deployment | $6 gas | 2 hours |
| KMS key management (AWS) | $1/mo | 4 hours |
| Frontend tests (Vitest) | $0 | 16 hours |
| Rate limiting tuning | $0 | 2 hours |
| **Subtotal** | **$12** | **26 hours** |

---

## 6. USER MIGRATION COSTS (60,000 TON Users)

### On-Chain Migration (CustodialDistribution.batchMigrate)

| Item | Calculation | Cost |
|------|------------|------|
| Batch size | 200 users per transaction | — |
| Total batches | 60,000 / 200 = 300 batches | — |
| Gas per batch (Base mainnet) | ~$0.05-0.10 | — |
| **Total gas cost** | 300 × $0.075 average | **~$22.50** |

### Backend Processing

| Item | Cost |
|------|------|
| Snapshot import processing | $0 (included in hosting) |
| Claim building | $0 (included in hosting) |
| Job dispatch & monitoring | $0 (included in hosting) |

### Communication to Users

| Channel | Cost |
|---------|------|
| Email notification (Resend) | $0 (free tier: 3,000/month) or $20/mo for 50K |
| Telegram bot notification | $0 |
| Website announcement | $0 |

### **TOTAL MIGRATION COST: ~$23-43**

---

## 7. COMPARISON: OLD TON vs NEW BASE

| Metric | TON (Old) | Base (New) |
|--------|-----------|-----------|
| Transaction cost | ~$0.01-0.05 | ~$0.001-0.01 |
| Finality | ~5 seconds | ~2 seconds |
| Smart contract language | FunC/Tact | Solidity |
| Wallet ecosystem | Tonkeeper | MetaMask, Rainbow, Coinbase |
| DeFi ecosystem | Limited | Extensive (Uniswap, Aave, etc.) |
| Developer tools | Emerging | Mature (Hardhat, Foundry, etc.) |
| Bridge options | Limited | Native Coinbase Bridge + 3rd party |
| Regulatory clarity | Uncertain | Coinbase-backed, US-compliant |
| Scaling | Custom L1 | Ethereum L2 (unlimited) |

---

## 8. SUMMARY TABLE

### Total Cost to Launch on Mainnet

| Category | Budget | Standard | Premium |
|----------|--------|----------|---------|
| Security Audit | $15,000 | $40,000 | $80,000 |
| Contract Deployment | $120 | $120 | $120 |
| DEX Liquidity | $10,000 | $25,000 | $50,000 |
| Legal Review | $0 | $5,000 | $20,000 |
| Migration (60K users) | $25 | $25 | $25 |
| Infrastructure (3 months) | $153 | $1,350 | $18,000 |
| Bug Fixes & Improvements | $0 | $0 | $0 |
| **TOTAL** | **~$25,300** | **~$71,500** | **~$168,150** |

### Monthly Burn Rate After Launch

| Scale | Users | Monthly Cost |
|-------|-------|-------------|
| Launch | 0-10K | ~$50-200 |
| Growth | 10K-100K | ~$450-700 |
| Scale | 100K-1M | ~$5,000-10,000 |
| Enterprise | 1M-10M | ~$20,000-50,000 |
| Global | 10M-100M | ~$50,000-100,000 |
| Massive | 100M-1B | ~$100,000-500,000 |

---

---

## 9. DEVELOPER / STAFFING COSTS

### Option A: In-House Team (Full-Time)

| Role | Monthly Salary (USD) | Location |
|------|---------------------|----------|
| Senior Solidity Developer | $10,000-20,000 | Remote |
| Senior Full-Stack Developer | $8,000-15,000 | Remote |
| DevOps / SRE Engineer | $8,000-12,000 | Remote |
| QA Engineer | $5,000-8,000 | Remote |
| Project Manager | $6,000-10,000 | Remote |
| **TOTAL (full team)** | **$37,000-65,000/mo** | |

### Option B: Contract / Part-Time

| Role | Monthly Cost | Scope |
|------|-------------|-------|
| Solidity consultant (10 hrs/mo) | $2,000-5,000 | Upgrades, audits, new features |
| Full-stack developer (20 hrs/mo) | $3,000-6,000 | Frontend + backend maintenance |
| DevOps (5 hrs/mo) | $1,000-2,000 | Monitoring, deployments |
| **TOTAL (part-time)** | **$6,000-13,000/mo** | |

### Option C: AI-Assisted Development (Current Approach)

| Item | Cost |
|------|------|
| Claude Code (Anthropic) | $100-200/mo |
| Human oversight (10 hrs/mo) | $1,000-3,000/mo |
| **TOTAL** | **$1,100-3,200/mo** |

**Note:** Current development has been 100% AI-assisted using Claude Code. The entire system (10 contracts, 618 tests, backend, frontend, docs) was built with AI, reviewed by human.

---

## 10. HOSTING COST BREAKDOWN (Current $0/month)

### What We're Using Right Now (Free)

| Service | Provider | Free Tier Limits | Status |
|---------|----------|-----------------|--------|
| Frontend | Vercel | 100GB bandwidth, 100 deploys/day | Active |
| Backend | Render | 750 hrs/mo, sleeps after 15 min idle | Active |
| Database | Neon PostgreSQL | 0.5 GB, 3 GB transfer | Active |
| RPC | Base Sepolia (public) | Unlimited (testnet) | Active |
| Email | Resend | 100 emails/day, 3K/month | Not configured |
| Git hosting | GitLab | 5 GB storage | Active |
| Wallet infra | WalletConnect Cloud | Free | Active |
| **TOTAL** | | | **$0/month** |

### Why It's Free
- All services offer free tiers sufficient for development and demo
- Base Sepolia testnet has no gas costs (faucet ETH)
- No domain purchased yet (using Vercel subdomain)
- AI development eliminates developer salaries during build phase

### When Free Tier Runs Out
- **Render**: Backend sleeps after 15 min idle → First user request takes 30-60s
- **Neon**: 0.5 GB database → Sufficient for ~100K users before upgrade needed
- **Vercel**: 100 GB bandwidth → Sufficient for ~50K monthly visits

---

## 11. TOTAL COST TIMELINE

### Pre-Launch (Now)
| Item | Cost |
|------|------|
| Infrastructure | $0/month |
| Development | $0 (AI-assisted) |
| Testing | $0 |
| **TOTAL** | **$0** |

### Launch Preparation (1-2 months)
| Item | One-Time | Monthly |
|------|----------|---------|
| Security audit | $15,000-80,000 | — |
| Render upgrade | — | $7 |
| Email API key | — | $0 |
| Domain | $15 | — |
| Multisig setup | $12 | — |
| **TOTAL** | **$15,027-80,027** | **$7/mo** |

### Mainnet Launch
| Item | One-Time | Monthly |
|------|----------|---------|
| Contract deployment | $120 | — |
| DEX liquidity | $10,000-50,000 | — |
| Migration (60K users) | $23 | — |
| Infrastructure | — | $50-200 |
| **TOTAL** | **$10,143-50,143** | **$50-200/mo** |

### Post-Launch Operations (ongoing)
| Scale | Users | Monthly Cost |
|-------|-------|-------------|
| Year 1 | 60K-100K | $50-500 |
| Year 2 | 100K-500K | $500-3,000 |
| Year 3 | 500K-2M | $3,000-10,000 |

---

*All costs are estimates based on March 2026 pricing. Actual costs may vary based on usage patterns, provider negotiations, and market conditions.*
