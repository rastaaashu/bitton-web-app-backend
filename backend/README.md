# BitTON.AI Backend

Node.js + TypeScript + Express + PostgreSQL + Prisma + ethers.js

## Quick Start

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install deps
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Push schema to DB
npx prisma db push

# 5. Copy env file
cp ../.env.example .env
# Edit .env with your values

# 6. Run dev server
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (ts-node) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm start` | Run compiled dist/index.js |
| `npm test` | Run Jest test suite |
| `npx prisma studio` | Open Prisma DB browser |

## Auth Flows (V2)

Three independent auth methods -- wallet is NOT required for email/telegram:

### Wallet Auth
1. `POST /auth/login/wallet/challenge` -- get sign message
2. `POST /auth/login/wallet/verify` -- submit signature, returns JWT

### Email Auth (OTP)
1. `POST /auth/register/email/init` -- sends 6-digit OTP
2. `POST /auth/verify-otp` -- verify OTP
3. `POST /auth/register/email/complete` -- complete registration

### Telegram Auth
1. `POST /auth/register/telegram/init` -- HMAC verification
2. `POST /auth/register/telegram/complete` -- complete registration

## V2 Contract Addresses (Base Sepolia)

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

## Deployed

- **URL**: https://bitton-backend.onrender.com
- **Health**: https://bitton-backend.onrender.com/health

## Environment Variables

See `.env.example` in the project root for all required variables.
