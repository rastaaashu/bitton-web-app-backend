# BitTON.AI -- Mainnet Readiness (V2)

**Last Updated:** 2026-03-18

## Status Summary

| Category | Status | Details |
|----------|--------|---------|
| Contracts (V2) | GREEN | Fresh V2 deployment, 77 tests passing |
| 3 Staking Products | GREEN | Flex30, Boost180, Max360 with USDC |
| Per-Product Splits | GREEN | 50/50, 20/80, 15/85 verified |
| Vesting (freeze+linear) | GREEN | Short: 30d+60d, Long: 180d+180d |
| Dual-Token Withdrawal | GREEN | BTN and USDC paths |
| ReserveFund | GREEN | Receives penalties, deployed |
| Frontend | GREEN | Updated for V2 3-product system |
| Backend | GREEN | Updated for V2 product types |
| Security Audit | RED | Not started -- critical blocker |
| Multisig | RED | Not deployed -- critical blocker |

**Overall: YELLOW** -- System is functionally complete. Audit and multisig are the remaining blockers.

## GREEN -- Done

### Contracts (V2 Fresh Deployment)

- All V2 contracts deployed to Base Sepolia with correct addresses
- 77 tests passing, 0 failures
- 3 staking products:
  - **Flex 30**: 30d lock, USDC, 0.25%/day, 50/50 split, principal returned, early exit (15% penalty to ReserveFund)
  - **Boost 180**: 180d lock, USDC, 1.0%/day, 20/80 split, principal to treasury
  - **Max 360**: 360d lock, USDC, 0.69%/day, 15/85 split, principal to treasury
- Vesting with freeze + linear release:
  - Short: 30-day freeze, 60-day linear
  - Long: 180-day freeze, 180-day linear
- Dual-token withdrawal (BTN or USDC at $2.25 platform price)
- ReserveFund deployed (replaces burns)
- Matching bonus: 10/7/5/4/3/2/2/1/1/1 (10 levels)
- BTN platform price: $2.25

### Frontend
- Updated for 3 staking products with USDC deposits
- Dual-token withdrawal UI
- Vault activation flow
- Vesting dashboard with freeze/release visibility
- Deployed at: https://bitton-contracts.vercel.app

### Backend
- Updated settlement logic for per-product reward splits
- New product type handling (Flex30, Boost180, Max360)
- USDC staking transaction processing
- Deployed at: https://bitton-backend.onrender.com

## RED -- Not Started

### Security Audit (CRITICAL)
- Engage auditor (Trail of Bits, OpenZeppelin, Cyfrin)
- Scope: all upgradeable contracts + ReserveFund
- Must cover USDC staking flows and dual-token withdrawal

### Multisig (CRITICAL)
- Deploy Gnosis Safe on Base (2-of-3 or 3-of-5)
- Transfer DEFAULT_ADMIN_ROLE on all contracts

### Timelock
- Deploy TimelockController (24-48h delay)
- Set as UUPS upgrade authority

### Mainnet Deployment
- Deploy all V2 contracts to Base mainnet
- Verify all contracts on Basescan
- Wire OPERATOR_ROLE grants
- Fund RewardEngine with BTN
- Fund WithdrawalWallet with USDC for dual-token withdrawals
