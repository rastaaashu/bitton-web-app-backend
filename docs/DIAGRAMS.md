# BitTON.AI -- System Diagrams (V2)

## 1. Staking & Reward Lifecycle (V2)

```mermaid
flowchart TD
    A[User activates vault T1/T2/T3] -->|Pay USDC or BTN| B[VaultManager]
    B --> C[User stakes USDC]
    C -->|Flex30 / Boost180 / Max360| D[StakingVault]

    D --> E{Settlement}
    E -->|Flex30: 50% liquid| F[WithdrawalWallet]
    E -->|Flex30: 50% vested| G[VestingPool]
    E -->|Boost180: 20% liquid| F
    E -->|Boost180: 80% vested| G
    E -->|Max360: 15% liquid| F
    E -->|Max360: 85% vested| G

    G -->|Freeze then linear release| F

    F -->|User withdraws BTN or USDC| H[User wallet]

    E --> I{Referral Bonuses}
    I -->|5% direct| J[BonusEngine]
    I -->|Level-based matching| J
    J --> F

    D -->|Early exit penalty 15%| K[ReserveFund]
```

## 2. Contract Architecture (V2)

```mermaid
graph TD
    BTN[BTNToken<br/>ERC-20, 21M supply]
    USDC[USDC Token<br/>Staking deposits]
    VM[VaultManager<br/>T1/T2/T3 activation]
    SV[StakingVault<br/>Flex30/Boost180/Max360]
    RE[RewardEngine<br/>Per-product splits]
    VP[VestingPool<br/>Freeze + linear release]
    WW[WithdrawalWallet<br/>BTN or USDC withdrawal]
    BE[BonusEngine<br/>Direct + matching]
    RF[ReserveFund<br/>Penalties & reserves]

    USDC -->|deposit| SV
    VM -->|gate| SV
    SV -->|rewards| RE
    RE -->|liquid %| WW
    RE -->|vested %| VP
    RE -->|bonuses| BE
    VP -->|release| WW
    BE -->|credit| WW
    SV -->|penalty| RF
    VP -->|early unlock penalty| RF

    style BTN fill:#f9f,stroke:#333
    style USDC fill:#9f9,stroke:#333
    style VM fill:#9ff,stroke:#333
    style SV fill:#9ff,stroke:#333
    style RE fill:#9ff,stroke:#333
    style VP fill:#9ff,stroke:#333
    style WW fill:#9ff,stroke:#333
    style BE fill:#9ff,stroke:#333
    style RF fill:#ff9,stroke:#333
```

## 3. Vesting Schedule (V2)

```mermaid
gantt
    title Vesting Timelines
    dateFormat  YYYY-MM-DD
    section Short Vesting (Flex 30)
    Freeze Period (30 days)    :a1, 2026-01-01, 30d
    Linear Release (60 days)   :a2, after a1, 60d
    section Long Vesting (Boost 180 / Max 360)
    Freeze Period (180 days)   :b1, 2026-01-01, 180d
    Linear Release (180 days)  :b2, after b1, 180d
```

## 4. Dual-Token Withdrawal Flow

```mermaid
flowchart LR
    A[WithdrawalWallet<br/>Balance in BTN] --> B{User choice}
    B -->|withdrawBTN| C[Send BTN to wallet]
    B -->|withdrawUSDC| D[Convert at $2.25<br/>Send USDC to wallet]
```

## 5. Product Comparison

```mermaid
graph LR
    subgraph Flex30
        F1[30d lock] --> F2[0.25%/day]
        F2 --> F3[50/50 split]
        F3 --> F4[Principal returned]
    end
    subgraph Boost180
        B1[180d lock] --> B2[1.0%/day]
        B2 --> B3[20/80 split]
        B3 --> B4[Principal to treasury]
    end
    subgraph Max360
        M1[360d lock] --> M2[0.69%/day]
        M2 --> M3[15/85 split]
        M3 --> M4[Principal to treasury]
    end
```

## 6. Auth Flow (Multi-Method)

```mermaid
flowchart TD
    A[User] --> B{Auth Method}
    B -->|Wallet| C[RainbowKit Connect]
    B -->|Email| D[Enter Email]
    B -->|Telegram| E[Widget Auth]

    C --> F[Sign Message]
    F --> G[JWT Issued]

    D --> H[OTP Sent]
    H --> I[Verify OTP]
    I --> G

    E --> J[HMAC Verified]
    J --> G

    G --> K[Dashboard]
```
