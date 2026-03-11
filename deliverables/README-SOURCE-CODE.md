# BitTON.AI - Complete Source Code Package

## Project Structure

```
bitton-contracts/
├── contracts/          # Solidity smart contracts (Hardhat)
├── abi/                # Contract ABIs (JSON)
├── backend/            # Express.js + TypeScript backend API
├── frontend/           # Next.js 14 + wagmi + RainbowKit frontend
├── scripts/            # Deployment scripts
├── test/               # Hardhat contract tests
└── tasks/              # Task tracking
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask browser extension
- Base Sepolia testnet ETH (from faucet)

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Edit with your values
npm run dev                        # Runs on http://localhost:3000
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env              # Edit with your values
npx prisma generate
npx prisma db push
npm run build
npm start                          # Runs on http://localhost:3001
```

### Smart Contracts (already deployed)
```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| BTN Token | `0xa874ae78f2A9f3EE6551ebdAf32f5B3bcF0a575D` |
| USDT Token | `0x1f15CdaACC32D6cA77FaaC8B080a3f2C0F597316` |
| Vault Manager | `0xA2b5ffe829441768E8BB8Be49f8ADee0041Fa1b0` |
| Staking Vault | `0x50d1516D6d5A4930623BCb7e1Ed28e9fAeA1e82F` |
| Reward Engine | `0xa86F6abB543b3fa6a2E2cC001870cF60a04c7f31` |
| Vesting Pool | `0xa3DC3351670E253d22B783109935fe0B9a11b830` |
| Withdrawal Wallet | `0xA06238c206C2757AD3f1572464bf720161519eC5` |
| Bonus Engine | `0xFD57598058EC849980F87F0f44bb019A73a0EfC7` |
| Custodial Distribution | `0x71dB030B792E9D4CfdCC7e452e0Ff55CdB5A4D99` |

## Live URLs

- **Frontend**: https://bitton-ai-testnet.netlify.app
- **Dev Wallet**: `0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A`
- **Chain**: Base Sepolia (Chain ID: 84532)

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, wagmi v2, RainbowKit v2, viem
- **Backend**: Express.js, TypeScript, Prisma, ethers.js v6, JWT auth
- **Contracts**: Solidity 0.8.27, Hardhat, OpenZeppelin (UUPS upgradeable)
- **Chain**: Base Sepolia (EVM L2)

## Key Constants

- BTN Token: 6 decimals (not 18!)
- USDT Token: 6 decimals
- Vault Tiers: T1 ($25), T2 ($50), T3 ($100)
- Short Staking: 30 days, tier multiplier
- Long Staking: 180 days, 1.2x fixed multiplier
- Settlement Split: 10% withdrawable, 90% vesting
- Vesting Release: 0.5% per day
- Direct Bonus: 5% of referred stake
- Matching Bonus: 10 levels (10%, 7%, 5%, 4%, 3%, 2%, 2%, 1%, 1%, 1%)
