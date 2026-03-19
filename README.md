# BitTON.AI Backend API

Node.js + Express + Prisma + PostgreSQL backend for the BitTON.AI staking platform on Base L2.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL (Neon serverless) |
| Blockchain | ethers.js v6 |
| Auth | JWT (HS256) + wallet signatures + OTP + Telegram |
| Email | Resend / SendGrid / SMTP |
| Validation | Zod schemas |
| Logging | Winston |

## Deployed

- **URL**: https://bitton-backend.onrender.com
- **Health**: https://bitton-backend.onrender.com/health

## Features

- **Multi-method auth**: Wallet (RainbowKit), Email (OTP), Telegram -- all independent
- **JWT sessions**: 15-min access + 7-day refresh with rotation
- **Sponsor/referral system**: Code generation, validation, tracking
- **Dashboard API**: Aggregated on-chain data from V2 contracts
- **Admin API**: User management, system monitoring
- **Migration pipeline**: TON to Base user balance migration
- **Operator job queue**: Background jobs for on-chain transactions

## V2 Contract Integration

The backend reads from and writes to the V2 smart contracts on Base Sepolia:

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

## API Endpoints Summary

### Auth (12+ endpoints)
- Wallet: challenge -> verify -> JWT
- Email: OTP init -> verify -> complete
- Telegram: widget verify -> complete
- Session: refresh, logout, profile

### Dashboard (5 endpoints)
- `/api/dashboard/:address` -- full user dashboard
- `/api/history/:address` -- transaction history
- `/api/stakes/:address` -- active stakes
- `/api/bonuses/:address` -- bonus history
- `/api/referrals/:address` -- referral data

### Sponsor (3 endpoints)
- Create sponsor code, validate, bootstrap

### Admin (9 endpoints, API key required)
- System status, user management, audit log
- TON snapshot import, migration, job dispatch

### Health
- `GET /health` -- DB + RPC + relayer check
- `GET /ready` -- DB readiness probe

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or Docker)

### Setup
```bash
cd backend
npm install
cp .env.example .env          # Edit with your values
npx prisma generate
npx prisma db push
npm run dev                    # http://localhost:3001
```

### Build
```bash
npm run build
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `RPC_URL` | Yes | Base RPC endpoint |
| `CHAIN_ID` | Yes | 84532 (Base Sepolia) |
| `RELAYER_PRIVATE_KEY` | Yes | Hot wallet for on-chain txs |
| `AUTH_SECRET` | Yes | JWT signing secret (64+ chars) |
| `ADMIN_API_KEY` | Yes | Admin endpoint auth |
| `APP_URL` | Yes | Frontend URL (CORS) |
| `EMAIL_API_KEY` | Recommended | Resend/SendGrid API key |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram auth |

## Security

- JWT with HS256, algorithm-pinned
- bcrypt password hashing
- Crypto-safe OTP generation
- Timing-safe admin key comparison
- Rate limiting: Global (100/min), Auth (20/15min), OTP (5/15min)
- Helmet security headers (CSP, HSTS)
- Zod input validation on all endpoints
- Audit logging for all state changes

## License

MIT
