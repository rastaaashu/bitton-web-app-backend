# BitTON.AI -- Mainnet Readiness

**Last Updated:** 2026-03-18

## Status Summary

| Category | Status | Details |
|----------|--------|---------|
| Contracts | GREEN | All contracts compile, 77 tests passing |
| New Products | GREEN | Flex30, Boost180, Max360 implemented and tested |
| USDC Staking | GREEN | USDC deposits working across all 3 products |
| Per-Product Splits | GREEN | 50/50, 20/80, 15/85 splits verified |
| Vesting | GREEN | Freeze + linear release working (short: 30d+60d, long: 180d+180d) |
| Dual-Token Withdrawal | GREEN | BTN and USDC withdrawal paths tested |
| Reserve Fund | GREEN | Deployed, receives penalties and protocol fees |
| Frontend | GREEN | Updated for 3-product system with USDC |
| Backend | GREEN | Updated for new product types and settlement logic |
| Security Audit | RED | Not started -- critical blocker |
| Multisig | RED | Not deployed -- critical blocker |
| Mainnet Deployment | RED | Pending audit and multisig |

**Overall: YELLOW** -- System is functionally complete. Audit and multisig are the remaining blockers.

**Target: Friday March 20 mainnet release**

## GREEN -- Done

### Contracts
- All contracts compile cleanly (Solidity 0.8.27)
- 77 tests passing, 0 failures (tests rewritten for new 3-product system; previously 618 tests for the old Short/Long BTN-only system)
- New staking products implemented:
  - **Flex 30**: 30-day lock, USDC, ~7.5%/cycle, principal returned, 50/50 reward split
  - **Boost 180**: 180-day lock, USDC, ~1%/day, 20/80 reward split
  - **Max 360**: 360-day lock, USDC, ~250% APR, 15/85 reward split
- USDC staking fully functional (BTN staking gated for future)
- Per-product reward splits working and verified in tests
- Vesting with freeze + linear release:
  - Short vesting: 30-day freeze, 60-day linear release
  - Long vesting: 180-day freeze, 180-day linear release
- Dual-token withdrawal: users can withdraw as BTN or USDC (converted at $2.25 platform price)
- ReserveFund deployed and wired (replaces burns)
- CustodialDistribution deployed for treasury management
- Deployed and verified on Base Sepolia

### Frontend
- Updated for 3 staking products with USDC deposits
- Dual-token withdrawal UI (BTN or USDC)
- Vault activation flow
- Vesting dashboard with freeze/release visibility

### Backend
- Updated settlement logic for per-product reward splits
- New product type handling (Flex30, Boost180, Max360)
- USDC staking transaction processing
- Backend compiles and builds clean

## YELLOW -- In Progress

### Security Audit (CRITICAL)
- Engage auditor (Trail of Bits, OpenZeppelin, Cyfrin)
- Scope: all upgradeable contracts + CustodialDistribution + ReserveFund
- Must cover new USDC staking flows and dual-token withdrawal
- Timeline: target completion before March 20

### Mainnet Gas Settings
- Add `base_mainnet` network to hardhat.config.js
- Configure EIP-1559 gas parameters for Base mainnet

## RED -- Not Started

### Multisig (CRITICAL)
- Deploy Gnosis Safe on Base (2-of-3 or 3-of-5)
- Transfer DEFAULT_ADMIN_ROLE on all contracts
- Transfer BTN Token ownership

### Timelock (CRITICAL)
- Deploy TimelockController (24-48h delay)
- Set as UUPS upgrade authority

### Relayer Key Management
- Use AWS KMS or HashiCorp Vault
- Never export private key
- Set up key rotation

### Mainnet Deployment
- Deploy all contracts to Base mainnet
- Verify all contracts on Basescan
- Wire OPERATOR_ROLE grants
- Fund RewardEngine with BTN
- Fund WithdrawalWallet with USDC for dual-token withdrawals

### Monitoring
- Health endpoint monitoring
- Relayer ETH balance alerts
- Contract event indexing
- Reserve Fund balance monitoring
- Custodial balance monitoring

### Incident Response Plan
- Emergency pause playbook
- Key compromise procedure
- RPC failover
