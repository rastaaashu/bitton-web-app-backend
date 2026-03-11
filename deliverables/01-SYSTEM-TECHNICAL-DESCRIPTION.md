# BitTON.AI — Technical System Description
**For: DevOps & Security Team**
**Date: 2026-03-11**
**Version: 1.0**

---

## 1. System Overview

BitTON.AI is a DeFi staking and referral platform deployed on **Base Sepolia** (testnet, Chain ID 84532). The system consists of three layers:

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Smart Contracts | Solidity 0.8.27, UUPS Proxies (OpenZeppelin) | Base Sepolia blockchain |
| Backend API | Node.js + TypeScript + Express + Prisma + PostgreSQL | Render (free tier) |
| Frontend | Next.js 14 + React + Tailwind + RainbowKit + Wagmi | Vercel |

**Repository:** `https://github.com/rastaaashu/bitton-contracts.git`

---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER (Browser / Mobile Wallet)               │
│                                                                      │
│   ┌──────────────────────┐          ┌──────────────────────────┐     │
│   │  Frontend (Vercel)   │◄────────►│  Backend API (Render)    │     │
│   │  Next.js 14          │  REST    │  Express + Prisma        │     │
│   │  Port: 443 (prod)    │  API     │  Port: 3001              │     │
│   │  localhost:3000 (dev) │         │  localhost:3001 (dev)    │     │
│   └──────────┬───────────┘          └──────────┬───────────────┘     │
│              │                                  │                     │
│              │ Wagmi/viem                        │ ethers.js v6       │
│              │ (direct RPC)                      │ (relayer signer)   │
│              ▼                                  ▼                     │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                  Base Sepolia Blockchain                      │   │
│   │                                                              │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│   │  │ VaultManager │  │ StakingVault │  │ RewardEngine     │   │   │
│   │  │ (UUPS Proxy) │  │ (UUPS Proxy) │  │ (UUPS Proxy)     │   │   │
│   │  └──────────────┘  └──────────────┘  └──────────────────┘   │   │
│   │                                                              │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│   │  │ VestingPool  │  │ Withdrawal   │  │ BonusEngine      │   │   │
│   │  │ (UUPS Proxy) │  │ Wallet       │  │ (UUPS Proxy)     │   │   │
│   │  └──────────────┘  │ (UUPS Proxy) │  └──────────────────┘   │   │
│   │                     └──────────────┘                         │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│   │  │ BTN Token    │  │ USDT Token   │  │ Oracle (Mock     │   │   │
│   │  │ (ERC20, 6d)  │  │ (ERC20, 6d)  │  │  Chainlink)      │   │   │
│   │  └──────────────┘  └──────────────┘  └──────────────────┘   │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                  PostgreSQL (Neon serverless)                 │   │
│   │  Users, Sessions, OTPs, SponsorCodes, MigrationClaims,      │   │
│   │  OperatorJobs, AuditLog, WalletLinks, TonSnapshots           │   │
│   └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deployed Contract Addresses (Base Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| BTN Token | `0x5b964baafEDf002e5364F37848DCa1908D3e4e9f` | ERC20 token (6 decimals, 21M max supply) |
| USDT Token | `0x69Bc9E30366888385f68cBB566EEb655CD5A34CC` | Mock stablecoin (6 decimals) |
| VaultManager | `0xA2b5ffe829441768E8BB8Be49f8ADee0041Fa1b0` | Tier activation (T1/T2/T3) |
| StakingVault | `0x50d1516D6d5A4930623BCb7e1Ed28e9fAeA1e82F` | Short & Long staking |
| RewardEngine | `0xa86F6abB543b3fa6a2E2cC001870cF60a04c7f31` | Weekly settlement & reward pool |
| VestingPool | `0xa3DC3351670E253d22B783109935fe0B9a11b830` | 90% locked rewards, daily release |
| WithdrawalWallet | `0xA06238c206C2757AD3f1572464bf720161519eC5` | 10% withdrawable balance |
| BonusEngine | `0xFD57598058EC849980F87F0f44bb019A73a0EfC7` | Direct & matching referral bonuses |
| Oracle | `0xf1DC093E1B3fD72A1C7f1B58bd3cE8A4832BEe52` | BTN/USD price feed (mock Chainlink) |
| Treasury | `0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A` | Fee collection & penalties |
| Custodial | `0x71dB030B792E9D4CfdCC7e452e0Ff55CdB5A4D99` | Token distribution (migration) |

All 6 core contracts use **UUPS proxy pattern** and are upgradeable.

---

## 4. Smart Contract System — Functional Description

### 4.1 User Flow

```
1. REGISTER → Connect wallet + referral code → Account created
2. ACTIVATE VAULT → Pay $25/$50/$100 in USDT or BTN → Tier assigned (T1/T2/T3)
3. STAKE → Deposit BTN into Short (30d) or Long (180d) program → Earn daily rewards
4. SETTLE → Weekly settlement splits rewards: 10% withdrawable, 90% vesting
5. RELEASE → Daily 0.5% of vesting pool released to withdrawal wallet
6. WITHDRAW → User withdraws BTN from withdrawal wallet to personal wallet
7. BONUSES → Direct: 5% of referred user's stake; Matching: level-based % of downline rewards
```

### 4.2 Vault Tiers

| Tier | Activation Fee (USD) | Staking Multiplier | Matching Bonus Depth |
|------|---------------------|-------------------|---------------------|
| T1 | $25 | 1.0x | 3 levels |
| T2 | $50 | 1.1x | 5 levels |
| T3 | $100 | 1.2x | 10 levels |

### 4.3 Staking Programs

| Parameter | Short Program | Long Program |
|-----------|--------------|-------------|
| Lock Period | 30 days | 180 days |
| Daily Rate | 0.5% × tier multiplier | 0.5% × 1.2 (fixed) |
| Early Exit | Allowed (15% penalty) | NOT allowed |
| Penalty Goes To | Treasury | N/A |

### 4.4 Reward Settlement (Weekly)

- **10%** → WithdrawalWallet (immediately withdrawable)
- **90%** → VestingPool (locked, released at 0.5% per day)
- Matching bonuses processed during settlement (walk up referral chain)

### 4.5 Matching Bonus Levels

| Level | % of Downline Reward | Required Tier |
|-------|---------------------|---------------|
| 1 | 10% | T1+ |
| 2 | 5% | T1+ |
| 3 | 3% | T1+ |
| 4-10 | 1% each | T3 only |

**Qualification:** Active vault + minimum 500 BTN personal stake.

### 4.6 Cross-Contract Permissions (OPERATOR_ROLE)

| Grantor | Grantee | Purpose |
|---------|---------|---------|
| StakingVault | RewardEngine | Reset reward timestamps after settlement |
| VestingPool | RewardEngine | Add vested amounts (90% split) |
| WithdrawalWallet | RewardEngine | Add withdrawable amounts (10% split) |
| WithdrawalWallet | VestingPool | Add released vesting to withdrawal |
| RewardEngine | BonusEngine | Add pending reward from bonuses |
| BonusEngine | RewardEngine | Process matching bonuses during settlement |

### 4.7 Security Features (Smart Contracts)

- **UUPS Proxy** — Upgradeable with admin-only authorization
- **ReentrancyGuard** — On all withdrawal/transfer functions
- **SafeERC20** — All token transfers use safe wrappers
- **Pausable** — Emergency pause on all contracts
- **AccessControl** — Role-based (ADMIN, OPERATOR, EMERGENCY)
- **Oracle Validation** — Staleness check (max 1 hour), zero price rejection
- **Checks-Effects-Interactions** — Pattern enforced throughout
- **Storage Gap** — 50 slots reserved for future upgrades
- **Solidity 0.8.27** — Built-in overflow/underflow protection

---

## 5. Backend API — Functional Description

### 5.1 Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL (Neon serverless) |
| Blockchain | ethers.js v6 |
| Auth | JWT (HS256) + wallet signatures |
| Email | Resend/SendGrid HTTP API or SMTP |
| Logging | Winston |

### 5.2 API Endpoints Summary

#### Authentication (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register/wallet` | Rate limit | Register via EVM wallet + sponsor code |
| POST | `/login/wallet/challenge` | Rate limit | Get challenge message for signing |
| POST | `/login/wallet/verify` | Rate limit | Verify wallet signature, return JWT |
| POST | `/register/email/init` | OTP limit | Start email registration (sends OTP) |
| POST | `/register/email/complete` | Rate limit | Complete email registration with wallet |
| POST | `/login/email/init` | OTP limit | Start email login (sends OTP) |
| POST | `/login/email/complete` | Rate limit | Complete email login |
| POST | `/register/telegram/init` | Rate limit | Start Telegram registration |
| POST | `/register/telegram/complete` | Rate limit | Complete Telegram registration |
| POST | `/login/telegram/init` | Rate limit | Start Telegram login |
| POST | `/login/telegram/complete` | Rate limit | Complete Telegram login |
| POST | `/verify-otp` | Rate limit | Verify 6-digit OTP |
| POST | `/resend-otp` | OTP limit | Resend OTP to email |
| GET | `/profile` | JWT | Get user profile |
| POST | `/profile/link-email/init` | JWT + OTP limit | Link email to wallet account |
| POST | `/profile/link-email/verify` | JWT | Verify linked email |
| POST | `/profile/link-telegram` | JWT | Link Telegram to wallet account |
| POST | `/refresh` | None | Refresh access token |
| POST | `/logout` | None | Revoke refresh token |
| GET | `/telegram/config` | None | Get Telegram bot configuration |

#### Dashboard Data (`/api`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/:address` | None | Full user dashboard (balances, stakes, vault, referrals) |
| GET | `/history/:address` | None | Transaction history from contract events |
| GET | `/stakes/:address` | None | User's active stakes |
| GET | `/bonuses/:address` | None | Direct + matching bonus history |
| GET | `/referrals/:address` | None | Referrer, downline, vault tier |

#### Sponsor/Referral (`/sponsor`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/code/create` | JWT | Create sponsor code |
| GET | `/validate/:codeOrAddress` | None | Validate sponsor code or wallet address |
| POST | `/bootstrap` | Admin API Key | Create initial admin user + code |

#### Migration (`/migration`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/status/:evmAddress` | None | Check migration status |
| GET | `/verify-balance/:tonAddress` | Rate limit | Verify TON balance in snapshot |
| POST | `/challenge` | Rate limit | Generate TonProof challenge |
| POST | `/link-wallet` | Rate limit | Link TON → EVM wallet (verified) |

#### Admin (`/admin`) — Requires `X-API-Key` header

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ton/import-snapshot` | Import TON snapshot CSV |
| POST | `/migration/build` | Build migration claims |
| POST | `/jobs/dispatch` | Dispatch migration batch jobs |
| POST | `/jobs/distribute` | Create manual distribution job |
| GET | `/status` | System status (custodial, jobs, users) |
| GET | `/jobs` | List operator jobs (paginated) |
| GET | `/audit` | View audit log |
| GET | `/users` | List users (paginated, searchable) |
| GET | `/users/:id` | Get user detail |

#### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Full health check (DB, RPC, relayer) |
| GET | `/ready` | Readiness probe (DB only) |

### 5.3 Authentication Flow

**Three auth methods — all require an EVM wallet as base layer:**

1. **Wallet Auth (primary):** Challenge-response signature → immediate CONFIRMED status
2. **Email Auth:** Email → OTP verification → wallet signature → CONFIRMED
3. **Telegram Auth:** Telegram widget OAuth → wallet signature → CONFIRMED

**Sponsor/Referral Requirement:** Every registration requires a valid sponsor code or existing user's wallet address.

**Token Lifecycle:**
- Access token: JWT, 15-minute expiry
- Refresh token: 7-day expiry, stored in LoginSession table
- Revocable via logout

### 5.4 Background Operator System

The backend runs an **OperatorRunner** that polls every 10 seconds for pending jobs:

| Job Type | Description |
|----------|-------------|
| DISTRIBUTE | Send BTN to a specific address |
| BATCH_MIGRATE | Migrate multiple TON users in one tx |
| FUND_CONTRACT | Fund a contract with BTN |
| SETTLE_WEEKLY | Trigger weekly settlement for user |

**Job Lifecycle:** PENDING → PROCESSING → SUBMITTED → CONFIRMED (or FAILED, max 3 retries)

### 5.5 Database Models

| Model | Purpose |
|-------|---------|
| User | Core user record (wallet, email, telegram, status, sponsor) |
| SponsorCode | Referral codes (auto-generated on registration) |
| LoginSession | JWT refresh token tracking |
| PendingSession | Multi-step auth flow state |
| OtpCode | 6-digit OTP (10-min expiry, max 5 attempts) |
| WalletChallenge | Wallet login challenges (one-time use) |
| WalletLink | TON → EVM wallet mappings (verified) |
| TonSnapshotRow | Historical TON balance data |
| MigrationClaim | Migration claim records |
| OperatorJob | Background job queue |
| AuditLog | Full audit trail |

### 5.6 Rate Limits

| Scope | Limit |
|-------|-------|
| Global | 100 requests / minute / IP |
| Auth endpoints | 20 requests / 15 minutes / IP |
| OTP endpoints | 5 requests / 15 minutes / IP |
| Migration endpoints | 10 requests / 5 minutes / IP |

### 5.7 Security Features (Backend)

- **Helmet** — CSP, HSTS, X-Frame-Options, referrer policy
- **CORS** — Whitelist: production URL + localhost origins
- **Rate Limiting** — Per-endpoint with express-rate-limit
- **JWT** — HS256 signing with strong secret
- **Wallet Verification** — ethers.verifyMessage() signature recovery
- **Telegram Verification** — HMAC-SHA256 against bot token
- **OTP Timing-Safe** — crypto.timingSafeEqual for comparison
- **Admin API Key** — Timing-safe comparison
- **Audit Logging** — All state-changing actions logged
- **Request Tracing** — X-Request-ID header
- **JSON Body Limit** — 1MB max

---

## 6. Frontend — Functional Description

### 6.1 Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React + Tailwind CSS |
| Wallet | RainbowKit + Wagmi + viem |
| State | TanStack React Query |
| Notifications | Sonner toasts |

### 6.2 Pages & Screens

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Multi-method auth (wallet/email/telegram) with risk disclaimer |
| Register | `/register` | Account creation with mandatory referral code |
| Dashboard | `/dashboard` | Overview: balances, vault tier, active stakes, pending rewards |
| Vault | `/vault` | Activate T1/T2/T3 with USDT or BTN payment |
| Staking | `/staking` | Create stakes (Short/Long), manage active stakes, unstake |
| Rewards | `/rewards` | View pending rewards, trigger weekly settlement |
| Vesting | `/vesting` | View locked balance, release vested tokens (0.5%/day) |
| Withdraw | `/withdraw` | Withdraw BTN to personal wallet |
| Referrals | `/referrals` | Referral link, downline list, matching bonus levels |
| History | `/history` | Transaction history from contract events |
| Settings | `/settings` | Profile, linked auth methods, sponsor codes |
| Admin | `/admin` | Fund reward pool, user lookup, contract addresses |

### 6.3 Key Features

- **Mobile-optimized** — Compact RainbowKit modal, responsive sidebar, auto-sign on connect
- **Real-time counters** — Vesting release accumulates live, stake countdown timers
- **Two-step flows** — Approve → Action pattern for all token operations
- **Role-gated admin** — Only visible to addresses with DEFAULT_ADMIN_ROLE

---

## 7. Environment Variables Reference

### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Blockchain
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
RELAYER_PRIVATE_KEY=<private-key>

# Contract Addresses
BTN_TOKEN_ADDRESS=0x5b964baafEDf002e5364F37848DCa1908D3e4e9f
USDT_TOKEN_ADDRESS=0x69Bc9E30366888385f68cBB566EEb655CD5A34CC
CUSTODIAL_ADDRESS=0x71dB030B792E9D4CfdCC7e452e0Ff55CdB5A4D99
VAULT_MANAGER_ADDRESS=0xA2b5ffe829441768E8BB8Be49f8ADee0041Fa1b0
STAKING_VAULT_ADDRESS=0x50d1516D6d5A4930623BCb7e1Ed28e9fAeA1e82F
REWARD_ENGINE_ADDRESS=0xa86F6abB543b3fa6a2E2cC001870cF60a04c7f31
VESTING_POOL_ADDRESS=0xa3DC3351670E253d22B783109935fe0B9a11b830
WITHDRAWAL_WALLET_ADDRESS=0xA06238c206C2757AD3f1572464bf720161519eC5
BONUS_ENGINE_ADDRESS=0xFD57598058EC849980F87F0f44bb019A73a0EfC7

# Authentication
AUTH_SECRET=<64-char-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
ADMIN_API_KEY=<admin-api-key>

# Email (pick one)
EMAIL_API_KEY=<resend-or-sendgrid-key>
EMAIL_API_PROVIDER=resend
SMTP_FROM=noreply@bitton.ai

# Telegram
TELEGRAM_BOT_TOKEN=<bot-father-token>
TELEGRAM_BOT_USERNAME=bitton_auth_bot

# App
APP_URL=https://bitton-contracts.vercel.app
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<walletconnect-project-id>
NEXT_PUBLIC_CHAIN=base-sepolia
NEXT_PUBLIC_API_URL=https://bitton-backend.onrender.com
```

---

## 8. Deployment Instructions

### 8.1 Backend (Render)

**Current:** Deployed via `render.yaml` blueprint on Render free tier.

**To deploy on dedicated infrastructure:**

```bash
cd backend
npm install
npx prisma generate
npx prisma db push          # Apply schema to database
npm run build                # Compile TypeScript
npm run start                # Start production server (port 3001)
```

**Health checks:**
- `GET /health` — Full check (DB + RPC + relayer balance)
- `GET /ready` — DB-only readiness probe

**Known issue:** Render free tier sleeps after 15 minutes of inactivity. Solution: upgrade to paid tier or use a keep-alive ping service.

### 8.2 Frontend (Vercel)

```bash
cd frontend
npm install
npm run build     # Next.js production build
npm run start     # Start production server (port 3000)
```

### 8.3 Smart Contracts (already deployed)

Contracts are already deployed and verified on Base Sepolia. For redeployment:

```bash
# Install dependencies
npm install

# Deploy all contracts
npx hardhat run scripts/deploy-all.js --network base_sepolia

# Verify on Basescan
npx hardhat run scripts/verify-all.js --network base_sepolia

# Run smoke test
npx hardhat run scripts/smoke-test.js --network base_sepolia
```

---

## 9. Test Suite

| Metric | Value |
|--------|-------|
| Total Tests | 619 passing |
| Coverage | 95%+ |
| Framework | Hardhat + Chai + ethers.js |

**Run tests:**
```bash
npx hardhat test              # Run all 619 tests
npx hardhat coverage          # Generate coverage report
```

**Test categories:**
- Unit tests per contract (VaultManager, StakingVault, RewardEngine, VestingPool, WithdrawalWallet, BonusEngine)
- System integration tests (full cross-contract flows)
- Security tests (reentrancy attacks, access control)
- Edge case tests (boundary values, overflow protection)

---

## 10. Scalability Assessment

| Phase | Users | Architecture |
|-------|-------|-------------|
| Current | Up to 100,000 | Single backend, serverless DB, Base L2 |
| Growth | 100K–1M | Horizontal scaling, read replicas, caching |
| Scale | 1M–100M | Microservices, dedicated RPC, indexer |

**Gas cost estimate:** ~$25 total for migrating 60,000 users (Base L2 is extremely cheap).

---

## 11. Known Limitations

1. **Render free tier** — Backend sleeps after 15 min inactivity (solve with paid tier)
2. **Testnet only** — All contracts on Base Sepolia, not mainnet
3. **Mock oracle** — Using MockAggregator, needs real Chainlink feed for mainnet
4. **No external security audit** — Internal tests only, needs third-party review
5. **Single relayer** — One private key for operator jobs (no redundancy)
