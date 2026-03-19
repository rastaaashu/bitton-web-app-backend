# BitTON.AI -- Testnet Deployment Summary (V2)

**Network:** Base Sepolia (chainId: 84532)
**Version:** V2 -- 3-product USDC staking system
**Date:** 2026-03-18

---

## Deployed Contracts (V2 -- Current)

| Contract | Address | Type |
|----------|---------|------|
| BTN Token | `0x5b964baafEDf002e5364F37848DCa1908D3e4e9f` | ERC-20 (6 decimals, 21M cap) |
| USDC Token | `0x69Bc9E30366888385f68cBB566EEb655CD5A34CC` | ERC-20 (mock) |
| VaultManager | `0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553` | UUPS Proxy |
| StakingVault | `0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B` | UUPS Proxy |
| RewardEngine | `0x97d1d86c709F4d5aEb93f46A60A16941c03076c0` | UUPS Proxy |
| VestingPool | `0x79D2CA5fb7ACF936198ec823a006a34cB611389e` | UUPS Proxy |
| WithdrawalWallet | `0xa523b6B9c3F2191C02ACfEc92C319D66315a3768` | UUPS Proxy |
| BonusEngine | `0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC` | UUPS Proxy |
| ReserveFund | `0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D` | UUPS Proxy |

---

## V2 System Parameters

### Staking Products

| Product | Type | Lock | Daily Rate | Liquid/Vested Split | Principal |
|---------|------|------|------------|---------------------|-----------|
| Flex 30 | 0 | 30d | 0.25% | 50/50 | Returned |
| Boost 180 | 1 | 180d | 1.0% | 20/80 | To treasury |
| Max 360 | 2 | 360d | 0.69% | 15/85 | To treasury |

### Vesting Schedules

| Type | Freeze | Linear Release |
|------|--------|----------------|
| Short (Flex 30) | 30 days | 60 days |
| Long (Boost 180 / Max 360) | 180 days | 180 days |

### Other Parameters

- **BTN Platform Price**: $2.25
- **Vault Fees**: T1=$25, T2=$50, T3=$100
- **Matching Bonus**: 10/7/5/4/3/2/2/1/1/1 (10 levels)
- **Early Exit Penalty**: 15% (Flex 30 only, to ReserveFund)
- **Staking Token**: USDC

---

## Quick Reference (Copy/Paste)

```
Network:             Base Sepolia (chainId 84532)
RPC:                 https://sepolia.base.org

BTN Token:           0x5b964baafEDf002e5364F37848DCa1908D3e4e9f
USDC Token:          0x69Bc9E30366888385f68cBB566EEb655CD5A34CC
VaultManager:        0xC5Ab43f26C1BacA8137cf4E4e1Ba98933D30C553
StakingVault:        0xf246C58FB64dAf6DA751Ea7d2c8db7d38E7a6C4B
RewardEngine:        0x97d1d86c709F4d5aEb93f46A60A16941c03076c0
VestingPool:         0x79D2CA5fb7ACF936198ec823a006a34cB611389e
WithdrawalWallet:    0xa523b6B9c3F2191C02ACfEc92C319D66315a3768
BonusEngine:         0x20189fFfa3B42B7D32b88376681D9c0Fec4A1eDC
ReserveFund:         0x8B7917daff5695461CFFDdCF5AA3dC7cC310793D
```

---

## Notes

1. V2 is a fresh deployment -- V1 contract addresses are deprecated.
2. All products accept USDC deposits. BTN staking is gated for future activation.
3. ReserveFund is new in V2, replacing the previous burn mechanism for penalties.
4. Vesting now uses freeze + linear release (not the old 0.5%/day model).
5. Matching bonus percentages updated: 10/7/5/4/3/2/2/1/1/1 (previously 10/5/3/1/.../1).
