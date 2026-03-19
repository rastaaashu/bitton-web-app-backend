# BitTON.AI -- Operations Runbook (V2)

## Local Development

### Prerequisites
- Node.js 18+
- Docker (for Postgres, optional)

### Smart Contracts
```bash
cd bitton-contracts
npm install
npx hardhat compile       # Compile all contracts
npx hardhat test          # Run 77 tests
npx hardhat coverage      # Generate coverage report
```

### Backend
```bash
cd backend
docker compose up -d      # Start Postgres (optional)
npm install
npx prisma generate       # Generate Prisma client
npx prisma db push        # Push schema to DB
npm run dev               # Start dev server on :3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # Start dev server on :3000
```

## Testnet Deployment (Base Sepolia)

### Deploy Contracts
```bash
# Set env vars in .env
npx hardhat run scripts/deploy-all.js --network base_sepolia
```

### Verify on Basescan
```bash
npx hardhat run scripts/verify-all.js --network base_sepolia
```

## Mainnet Deployment

### Pre-Deploy Checklist
- [ ] Security audit completed
- [ ] Multisig deployed (Gnosis Safe, 2-of-3 or 3-of-5)
- [ ] TimelockController deployed (24-48h delay)
- [ ] Real USDC address on Base configured
- [ ] Gas settings in hardhat.config.js (base_mainnet network)

### Deploy Sequence
1. Deploy BTNToken (or use existing)
2. Deploy 7 UUPS proxies (VaultManager, StakingVault, RewardEngine, VestingPool, WithdrawalWallet, BonusEngine, ReserveFund)
3. Grant OPERATOR_ROLE (9 grants)
4. Wire cross-contract addresses
5. Fund RewardEngine with BTN
6. Fund WithdrawalWallet with USDC for dual-token withdrawals
7. Transfer admin roles to multisig
8. Deploy TimelockController, transfer upgrade authority

## Backend Deployment (Render)

```bash
cd backend
npx prisma migrate deploy
npm run build
npm start
```

### Key Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `RPC_URL` | Base RPC endpoint |
| `RELAYER_PRIVATE_KEY` | Hot wallet for on-chain txs |
| `AUTH_SECRET` | JWT signing secret |
| `ADMIN_API_KEY` | Admin endpoint auth key |
| `EMAIL_API_KEY` | Email sending (Resend) |
| `TELEGRAM_BOT_TOKEN` | Telegram auth |

## Frontend Deployment (Vercel)

1. Set `NEXT_PUBLIC_API_URL` to the backend URL
2. Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
3. Set `NEXT_PUBLIC_CHAIN` to `base-sepolia` (or `base` for mainnet)
4. Root directory: `frontend`
5. Build command: `npm run build`

## Monitoring

- Health: `GET /health` -- checks DB, RPC, relayer balance
- Relayer ETH: alert when < 0.1 ETH
- Reserve Fund balance monitoring
- Contract event indexing

## Emergency Procedures

### Pause Contracts
All UUPS contracts have `pause()` via EMERGENCY_ROLE.

### Key Compromise
1. Pause all contracts
2. Rotate relayer key
3. Revoke compromised role on all contracts
4. Assess damage via audit log + events

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
