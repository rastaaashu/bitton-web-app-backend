# BitTON.AI -- User Guide

Welcome to BitTON.AI. This guide walks you through everything you need to know about using the platform, from creating your account to staking, earning rewards, and withdrawing your BTN tokens.

---

## Chapter 1: Getting Started -- Registration & Login

### How to Register

You need a referral link from an existing BitTON.AI member to join. The link looks like this:

```
https://bitton-ai-testnet.netlify.app/register?ref=YOUR-CODE
```

Once you have the link, follow these steps:

1. **Open the referral link** in your browser (desktop or mobile)
2. **Install MetaMask** (or any Web3 wallet) if you haven't already
3. **Fill in your details:**
   - Your email address
   - A password (at least 8 characters)
   - Confirm your password
4. **Connect your wallet** by clicking the "Connect Wallet" button and selecting MetaMask
5. **Click "Create Account"** -- your wallet will ask you to sign a message. This proves you own the wallet. No tokens are sent, no gas is used.
6. **Check your email** -- you'll receive a verification link. Click it to activate your account.

That's it. Your account is now active and linked to your wallet.

### How to Login

1. Open the BitTON.AI app
2. **Connect your wallet** using the connect button
3. **Click "Sign in"** -- your wallet will ask you to sign a message
4. You're in. The app remembers your session for 7 days.

### Important Notes

- You can only have **one account per wallet** and **one account per email**
- Your wallet address is permanently linked to your account
- If you disconnect your wallet, you'll need to reconnect and sign again to access your account
- You must be on the **Base Sepolia** network (the app will warn you if you're on the wrong network)

---

## Chapter 2: Vault Activation -- Unlocking Your Tier

Before you can start staking, you need to activate a vault. Think of your vault as your membership level. Higher tiers give you better rewards and deeper referral bonuses.

### The Three Tiers

| Tier | Cost | Staking Multiplier | Referral Depth |
|------|------|--------------------|----------------|
| Tier 1 | $25 | 1.0x (standard) | 3 levels deep |
| Tier 2 | $50 | 1.1x (10% bonus) | 5 levels deep |
| Tier 3 | $100 | 1.2x (20% bonus) | 10 levels deep |

### How to Activate Your Vault

1. Go to the **Vault** page from the sidebar
2. Choose your tier (T1, T2, or T3)
3. Choose your payment method: **USDT** or **BTN**
   - If paying with BTN, the amount is calculated automatically using the current BTN price
4. **Approve** the token transfer (first transaction)
5. **Activate** the vault (second transaction)
6. Done -- your vault is now active and your tier is displayed in the sidebar

### What Your Tier Affects

- **Staking rewards**: Higher tiers earn more per day (Short staking program)
- **Referral bonuses**: Higher tiers unlock more levels of matching bonuses from your team
- Your vault activation fee goes to the platform treasury

---

## Chapter 3: Staking -- Put Your BTN to Work

Staking is how you earn rewards. You lock up your BTN tokens for a period of time, and in return you earn daily rewards.

### Two Staking Programs

**Short Staking (30 days)**
- Lock your BTN for 30 days
- Earn 0.5% per day, multiplied by your tier (T1: 1.0x, T2: 1.1x, T3: 1.2x)
- You CAN exit early, but you'll pay a 15% penalty on your staked amount
- The penalty goes to the platform treasury

**Long Staking (180 days)**
- Lock your BTN for 180 days
- Earn 0.5% per day with a fixed 1.2x multiplier (same for all tiers)
- You CANNOT exit early -- your tokens are locked for the full 180 days
- Higher rewards for the commitment

### How to Stake

1. Go to the **Staking** page
2. Choose your program: Short (30 days) or Long (180 days)
3. Enter the amount of BTN you want to stake
4. Review the estimated daily and weekly rewards shown on screen
5. **Approve** the BTN transfer (first transaction)
6. **Stake** (second transaction)
7. Your stake appears in the table below with a countdown timer

### Viewing Your Stakes

The staking page shows all your active stakes with:
- Amount staked
- Program type (Short or Long)
- Time remaining until unlock
- Whether you can unstake yet

### Unstaking

- **Short program**: Click "Unstake" at any time. If the 30-day lock hasn't passed, you'll see the 15% penalty amount before confirming.
- **Long program**: The "Unstake" button only becomes available after 180 days.

### Test Results -- Staking System

Our staking smart contracts have been thoroughly tested. Here are the verified results:

- Staking with correct amounts and programs works perfectly
- Short staking correctly calculates daily rewards with tier multipliers
- Long staking applies the fixed 1.2x multiplier regardless of tier
- Early exit from Short staking correctly deducts 15% penalty
- Early exit from Long staking is blocked as expected
- Unstaking after lock period returns full staked amount
- Multiple simultaneous stakes are tracked independently
- Very small stakes (1 BTN) and very large stakes (1,000,000 BTN) both work correctly
- Reward calculations handle rounding properly with no loss of precision

**All 87 staking tests passed.**

---

## Chapter 4: Rewards & Settlement

Your staking rewards don't go directly to your wallet. They go through a weekly settlement process that splits them into two parts.

### How Settlement Works

Every week, your accumulated rewards are settled:
- **10%** goes to your **Withdrawal Wallet** (available to withdraw immediately)
- **90%** goes to your **Vesting Pool** (released gradually over time)

This split ensures the platform remains sustainable while still giving you immediate access to some of your earnings.

### How to Settle

1. Go to the **Rewards** page
2. You'll see your pending rewards and when the last settlement happened
3. Click **"Settle Rewards"** to process your weekly settlement
4. The app shows a preview of the split: how much goes to withdrawable vs vesting

### Important Notes

- Settlement can be done once per week per user
- If you don't settle for multiple weeks, your rewards accumulate and can be settled all at once
- Settlement is a blockchain transaction, so you'll need a small amount of ETH for gas

### Test Results -- Reward Engine

- Weekly settlement correctly splits rewards 10/90
- Accumulated rewards over multiple weeks settle correctly in one transaction
- Reward calculations match the formula: `staked amount x 0.5% x days x tier multiplier`
- The reward pool balance decreases correctly after each settlement
- Settlement cannot be exploited to claim more than earned

**All 78 reward engine tests passed.**

---

## Chapter 5: Vesting -- Gradual Release of Locked Rewards

The 90% of your rewards that go to the Vesting Pool are released gradually at a rate of **0.5% per day**.

### How Vesting Works

- After settlement, 90% of your rewards are locked in the Vesting Pool
- Every day, 0.5% of your locked balance becomes available for release
- You can release the accumulated amount at any time
- Released tokens move to your Withdrawal Wallet

### How to Release Vested Tokens

1. Go to the **Vesting** page
2. You'll see:
   - Your total vested (locked) balance
   - The amount currently available for release (growing in real-time)
   - A progress bar showing how much has been released
3. Click **"Release"** to move available tokens to your Withdrawal Wallet

### Example

Say you have 1,000 BTN in vesting:
- Day 1: 5 BTN available (0.5% of 1,000)
- Day 2: 4.975 BTN available (0.5% of 995)
- Day 10: approximately 48.77 BTN total released
- Day 200: the entire balance is fully released

### Test Results -- Vesting Pool

- 0.5% daily release rate calculates correctly
- Releasing at different time intervals produces accurate amounts
- Very large balances (1,000,000 BTN) and very small balances (1 BTN) both work
- Full drain after 200 days works correctly
- Adding new vesting after full drain restarts the cycle
- Rounding is handled correctly for small time intervals

**All 55 vesting pool tests passed.**

---

## Chapter 6: Withdrawals

Your Withdrawal Wallet holds all the BTN that's ready for you to take out. This includes:
- The 10% from weekly settlements
- Released tokens from the Vesting Pool
- Any referral bonuses you've earned

### How to Withdraw

1. Go to the **Withdraw** page
2. You'll see your withdrawable balance
3. Enter the amount you want to withdraw (or click MAX for the full balance)
4. Click **"Withdraw"**
5. The BTN tokens are sent directly to your connected wallet

### Test Results -- Withdrawal Wallet

- Withdrawals transfer exact amounts to user wallets
- Partial and full withdrawals both work correctly
- Multiple deposits from different sources accumulate correctly
- Weekly withdrawal caps are enforced when set
- Caps reset automatically at the start of each new week
- Users cannot withdraw more than their balance
- Each user's balance is tracked independently

**All 56 withdrawal wallet tests passed.**

---

## Chapter 7: Referrals & Bonuses

BitTON.AI has a two-part referral system: Direct Bonuses and Matching Bonuses.

### Direct Bonus (5%)

When someone you referred stakes BTN, you earn **5% of their staked amount** as a bonus. This is automatic -- no action needed from you.

Example: Your friend stakes 1,000 BTN. You earn 50 BTN as a direct bonus.

### Matching Bonus (Level-Based)

When people in your team earn staking rewards, you earn a percentage of those rewards based on your tier and the level of the person in your team:

| Level | Percentage |
|-------|------------|
| Level 1 (your direct referrals) | 10% |
| Level 2 | 7% |
| Level 3 | 5% |
| Level 4 | 4% |
| Level 5 | 3% |
| Level 6 | 2% |
| Level 7 | 2% |
| Level 8 | 1% |
| Level 9 | 1% |
| Level 10 | 1% |

**How many levels you can earn from depends on your tier:**
- Tier 1: Levels 1-3
- Tier 2: Levels 1-5
- Tier 3: Levels 1-10

### Qualification Requirements

To earn matching bonuses, you must:
1. Have an **active vault** (any tier)
2. Have at least **500 BTN personally staked**

If you don't meet both requirements, matching bonuses from your team are skipped (they don't go to the next person up -- they simply aren't distributed).

### How to Set Up Referrals

1. Go to the **Referrals** page
2. Your unique referral link is displayed at the top -- copy and share it
3. When someone registers using your link, they appear in your downline
4. You can see your downline list, qualification status, and which matching levels are unlocked

### Test Results -- Bonus Engine

- Direct bonus correctly calculates 5% of staked amounts
- Matching bonus distributes correct percentages at each level
- Tier depth limits are enforced (T1 stops at level 3, T2 at level 5, T3 at level 10)
- Unqualified users in the chain are correctly skipped
- Users without active vaults don't receive matching bonuses
- Users with less than 500 BTN staked don't receive matching bonuses
- Circular referral chains are prevented
- Self-referral is blocked
- Mixed tiers in a referral chain work correctly

**All 76 bonus engine tests passed.**

---

## Chapter 8: Dashboard Overview

The Dashboard is your home screen. It gives you a quick snapshot of everything happening with your account.

### What You'll See

- **BTN Balance**: How many BTN tokens are in your wallet
- **Total Staked**: The total amount of BTN you currently have staked
- **Vesting Locked**: How much is locked in your Vesting Pool
- **Withdrawable**: How much is ready to withdraw right now
- **Vault Tier**: Your current membership tier
- **Pending Rewards**: Rewards waiting to be settled
- **Active Stakes**: A table showing all your current stakes with countdown timers

### Alerts

- If your vault is not activated, the dashboard shows a warning with a link to activate it
- If you're on the wrong network, a red banner appears at the top

---

## Chapter 9: Admin Panel

The Admin page is only accessible to platform administrators. Regular users won't have access to the admin functions.

### Admin Features

- **Fund Rewards**: Add BTN tokens to the reward pool to fund user rewards
- **User Lookup**: Search any user by wallet address to view their vault tier, staked amounts, pending rewards, and referral information
- **Global Stats**: View total staked across the platform and the current reward pool balance

---

## Chapter 10: Security & Smart Contract Verification

All BitTON.AI smart contracts have been built with security as the top priority.

### Security Features

- **Upgradeable contracts**: All core contracts use the UUPS proxy pattern, allowing bug fixes without losing user data
- **Role-based access**: Admin, Operator, and Emergency roles are separated. No single person can do everything.
- **Reentrancy protection**: All withdrawal functions are protected against reentrancy attacks
- **Safe token transfers**: All BTN transfers use OpenZeppelin's SafeERC20 library
- **Pause capability**: In an emergency, withdrawals can be paused while deposits continue working
- **No hidden minting**: All rewards come from a pre-funded reward pool. The platform cannot create BTN out of thin air.
- **Oracle validation**: BTN price data is validated for staleness and zero values

### Complete Test Results Summary

| Contract | Tests | Result |
|----------|-------|--------|
| BTN Token | 32 | All passing |
| Vault Manager | 62 | All passing |
| Staking Vault | 87 | All passing |
| Reward Engine | 78 | All passing |
| Vesting Pool | 55 | All passing |
| Withdrawal Wallet | 56 | All passing |
| Bonus Engine | 76 | All passing |
| Custodial Distribution | 38 | All passing |
| Legacy Contracts | 134 | All passing |
| **Total** | **618** | **All passing** |

Every function, every edge case, every error condition has been tested. The system handles everything from 1 BTN to 1,000,000 BTN amounts correctly.

---

## Chapter 11: Network & Technical Details

### Current Deployment

- **Network**: Base Sepolia Testnet (for testing)
- **Production Network**: Base (Ethereum Layer 2) -- coming soon
- **Token**: BTN (6 decimal places, 21 million total supply)
- **App URL**: https://bitton-ai-testnet.netlify.app

### Key Numbers at a Glance

| Parameter | Value |
|-----------|-------|
| BTN Total Supply | 21,000,000 |
| Short Staking Lock | 30 days |
| Long Staking Lock | 180 days |
| Daily Reward Rate | 0.5% |
| Early Exit Penalty | 15% (Short only) |
| Settlement Split | 10% withdrawable / 90% vesting |
| Vesting Release Rate | 0.5% per day |
| Direct Referral Bonus | 5% of stake |
| Matching Bonus Levels | Up to 10 levels |
| Vault Tiers | 3 ($25 / $50 / $100) |

---

## Chapter 12: Roadmap & What's Coming

### Currently Live (Testnet)

- Full registration and login system with wallet authentication
- Vault activation with three tiers
- Both staking programs (Short and Long)
- Weekly reward settlement
- Vesting pool with daily release
- Withdrawal system
- Complete referral and bonus engine
- Admin dashboard

### Coming Next

- Mainnet deployment on Base
- Mobile-optimized experience
- Email notifications for settlements and bonuses
- Transaction history with detailed breakdowns
- Enhanced referral tracking and team overview
- Additional staking programs

---

*This guide was last updated on March 5, 2026. For the latest information, visit the BitTON.AI app or contact your referrer.*
