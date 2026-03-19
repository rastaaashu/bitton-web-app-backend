# BitTON.AI -- Source Code Package (V2)

## Project Structure

```
bitton-contracts/
├── contracts/          # Solidity smart contracts (Hardhat)
├── abi/                # Contract ABIs (JSON)
├── scripts/            # Deployment scripts
├── test/               # Hardhat contract tests (77 passing)
├── docs/               # Technical documentation
├── deliverables/       # Deliverable documents
└── tasks/              # Task tracking
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- MetaMask browser extension
- Base Sepolia testnet ETH (from faucet)

### Smart Contracts
```bash
npm install
npx hardhat compile
npx hardhat test          # 77 tests passing
```

### Deploy (Base Sepolia)
```bash
# Set environment variables in .env
npx hardhat run scripts/deploy-all.js --network base_sepolia
```

## V2 Deployed Contracts (Base Sepolia)

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

## V2 System

- **3 staking products**: Flex 30, Boost 180, Max 360
- **USDC staking** (BTN staking gated for future)
- **Per-product splits**: 50/50, 20/80, 15/85 (liquid/vested)
- **Vesting**: Short (30d freeze + 60d linear), Long (180d freeze + 180d linear)
- **Dual-token withdrawal**: BTN or USDC at $2.25 platform price
- **ReserveFund**: Receives penalties (replaces burns)
- **Matching bonus**: 10/7/5/4/3/2/2/1/1/1% (10 levels)

## Live Services

| Service | URL |
|---------|-----|
| Frontend | https://bitton-contracts.vercel.app |
| Backend | https://bitton-backend.onrender.com |
