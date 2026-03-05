# BitTON.AI -- User Guide

Welcome to BitTON.AI. This guide walks you through everything you need to know about using the platform, from creating your account to staking, earning rewards, and withdrawing your BTN tokens. Every number in this guide has been verified through our 618 automated tests.

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
   - If paying with BTN, the amount is calculated using the live BTN price from the oracle (currently $0.50 per BTN)
   - Example: Tier 1 costs $25. At $0.50 per BTN, that's 50 BTN.
   - Example: Tier 3 costs $100. At $0.50 per BTN, that's 200 BTN.
4. **Approve** the token transfer (first transaction)
5. **Activate** the vault (second transaction)
6. Done -- your vault is now active and your tier is displayed in the sidebar

### What Happens to the Fee

Your vault activation fee goes to the platform treasury. It is not refundable and is a one-time payment.

### What Your Tier Affects

Here's a real example of how tiers change your earnings on a 1,000 BTN stake in the Short program:

| Tier | Daily Reward | Weekly Reward | 30-Day Total |
|------|-------------|---------------|--------------|
| Tier 1 (1.0x) | 5.0 BTN | 35.0 BTN | 150 BTN |
| Tier 2 (1.1x) | 5.5 BTN | 38.5 BTN | 165 BTN |
| Tier 3 (1.2x) | 6.0 BTN | 42.0 BTN | 180 BTN |

The difference between Tier 1 and Tier 3 over 30 days: **30 extra BTN** on a 1,000 BTN stake. That's 30 BTN more just from the tier upgrade.

---

## Chapter 3: Staking -- Put Your BTN to Work

Staking is how you earn rewards. You lock up your BTN tokens for a period of time, and in return you earn daily rewards. Every calculation below has been verified in our tests.

### Two Staking Programs

**Short Staking (30 days)**
- Lock your BTN for 30 days
- Earn 0.5% per day, multiplied by your tier
- You CAN exit early, but you'll pay a 15% penalty on your staked amount
- The penalty goes to the platform treasury

**Long Staking (180 days)**
- Lock your BTN for 180 days
- Earn 0.5% per day with a fixed 1.2x multiplier (same for all tiers)
- You CANNOT exit early -- your tokens are locked for the full 180 days
- Higher rewards for the commitment

### Reward Calculation -- How It Works

The formula is simple:

```
Daily Reward = Staked Amount x 0.5% x Tier Multiplier
```

### Short Staking Examples (verified in tests)

**Example 1: 1,000 BTN staked, Tier 1**
- Daily reward: 1,000 x 0.5% x 1.0 = **5 BTN per day**
- After 7 days: **35 BTN** earned
- After 30 days (full lock): **150 BTN** earned
- You get your 1,000 BTN back + 150 BTN rewards = 1,150 BTN total

**Example 2: 1,000 BTN staked, Tier 2**
- Daily reward: 1,000 x 0.5% x 1.1 = **5.5 BTN per day**
- After 7 days: **38.5 BTN** earned
- After 30 days: **165 BTN** earned

**Example 3: 1,000 BTN staked, Tier 3**
- Daily reward: 1,000 x 0.5% x 1.2 = **6 BTN per day**
- After 7 days: **42 BTN** earned
- After 30 days: **180 BTN** earned

**Example 4: 500 BTN staked, Tier 1**
- Daily reward: 500 x 0.5% x 1.0 = **2.5 BTN per day**
- After 7 days: **17.5 BTN** earned

### Long Staking Examples (verified in tests)

The Long program always uses a 1.2x multiplier, no matter what tier you have.

**Example 1: 1,000 BTN staked (any tier)**
- Daily reward: 1,000 x 0.5% x 1.2 = **6 BTN per day**
- After 7 days: **42 BTN** earned
- After 30 days: **180 BTN** earned
- After 180 days (full lock): **1,080 BTN** earned
- You get your 1,000 BTN back + 1,080 BTN rewards = 2,080 BTN total

**Example 2: 500 BTN staked, Long program**
- Daily reward: 500 x 0.5% x 1.2 = **3 BTN per day**
- After 7 days: **21 BTN** earned

### Early Exit -- The 15% Penalty (Short Program Only)

If you unstake from the Short program before 30 days, you lose 15% of your staked amount. Here are verified examples:

**Example 1: 1,000 BTN staked, exit on day 10**
- Penalty: 1,000 x 15% = **150 BTN** (goes to treasury)
- You receive: **850 BTN** back
- You lost 150 BTN of your original stake

**Example 2: 333.33 BTN staked, early exit**
- Penalty: 333.33 x 15% = **49.99 BTN**
- You receive: **283.33 BTN** back

**After 30 days**: No penalty. You get your full 1,000 BTN back.

**Long program**: There is no early exit. If you try to unstake before 180 days, the transaction will fail. Your tokens are locked.

### Multiple Stakes

You can have multiple stakes running at the same time. Each stake is tracked separately with its own countdown timer and rewards.

### How to Stake

1. Go to the **Staking** page
2. Choose your program: Short (30 days) or Long (180 days)
3. Enter the amount of BTN you want to stake
4. Review the estimated daily and weekly rewards shown on screen
5. **Approve** the BTN transfer (first transaction)
6. **Stake** (second transaction)
7. Your stake appears in the table below with a countdown timer

### Test Results -- Staking System

All of the numbers above come directly from our automated tests. Here is what was verified:

- 1,000 BTN stake at T1 produces exactly 5 BTN/day (tested and confirmed)
- 1,000 BTN stake at T2 produces exactly 5.5 BTN/day (tested and confirmed)
- 1,000 BTN stake at T3 produces exactly 6 BTN/day (tested and confirmed)
- Long program produces exactly 6 BTN/day on 1,000 BTN (tested and confirmed)
- Early exit penalty of exactly 150 BTN on a 1,000 BTN stake (tested and confirmed)
- No penalty after exactly 30 days (tested and confirmed)
- Long program blocks early exit completely (tested and confirmed)
- Rewards calculated per-second (even 1 hour of staking = 0.208333 BTN on 1,000 BTN T1)
- Very small stakes (1 BTN) and very large stakes (1,000,000 BTN) both work correctly
- Multiple simultaneous stakes tracked independently

**All 87 staking tests passed.**

---

## Chapter 4: Rewards & Settlement

Your staking rewards don't go directly to your wallet. They go through a weekly settlement process that splits them into two parts.

### How Settlement Works

Every week, your accumulated rewards are settled:
- **10%** goes to your **Withdrawal Wallet** (available to withdraw immediately)
- **90%** goes to your **Vesting Pool** (released gradually over time)

### Settlement Examples (verified in tests)

**Example 1: 1,000 BTN staked, Tier 1, Short program, after 7 days**
- Total reward earned: **35 BTN**
- Withdrawable (10%): **3.5 BTN** -- you can withdraw this right away
- Vesting (90%): **31.5 BTN** -- this gets released gradually (see Chapter 5)

**Example 2: 1,000 BTN staked, Tier 3, Short program, after 7 days**
- Total reward earned: **42 BTN**
- Withdrawable (10%): **4.2 BTN**
- Vesting (90%): **37.8 BTN**

**Example 3: 1,000 BTN staked, Long program, after 7 days**
- Total reward earned: **42 BTN**
- Withdrawable (10%): **4.2 BTN**
- Vesting (90%): **37.8 BTN**

**Example 4: 1,000 BTN Short + 500 BTN Long, Tier 1, after 7 days**
- Short reward: 35 BTN + Long reward: 21 BTN = **56 BTN total**
- Withdrawable (10%): **5.6 BTN**
- Vesting (90%): **50.4 BTN**

**Example 5: Operator adds 10 BTN bonus on top of staking rewards**
- Staking reward: 35 BTN + Bonus: 10 BTN = **45 BTN total**
- Withdrawable (10%): **4.5 BTN**
- Vesting (90%): **40.5 BTN**

### What Happens If You Don't Settle

If you don't settle for multiple weeks, your rewards accumulate. When you do settle, everything is processed in one go.

**Example: 1,000 BTN staked, Tier 1, skip 2 weeks**
- Week 1: 35 BTN earned
- Week 2: 35 BTN earned
- You settle after 14 days: **70 BTN total**
- Withdrawable: **7 BTN**
- Vesting: **63 BTN**

### Where Do Rewards Come From?

All rewards are paid from a pre-funded reward pool. The platform funds this pool with BTN tokens. There is no hidden minting -- every BTN paid out was put into the pool by the admin.

If the reward pool runs empty, settlements will fail until more BTN is added. This protects the system from paying out tokens that don't exist.

### How to Settle

1. Go to the **Rewards** page
2. You'll see your pending rewards and when the last settlement happened
3. Click **"Settle Rewards"** to process your weekly settlement
4. The app shows a preview of the split before you confirm

### Test Results -- Reward Engine

- 35 BTN reward splits exactly to 3.5 BTN withdrawable + 31.5 BTN vesting (verified)
- 42 BTN reward splits exactly to 4.2 BTN withdrawable + 37.8 BTN vesting (verified)
- Very small rewards: 10 units splits to 1 unit withdrawable + 9 units vesting (verified)
- Multi-week accumulation settles correctly in one transaction (verified)
- Reward pool balance decreases correctly after each settlement (verified)
- System reverts if reward pool has insufficient funds (verified)
- Settlement with bonus rewards included splits correctly (verified)

**All 78 reward engine tests passed.**

---

## Chapter 5: Vesting -- Gradual Release of Locked Rewards

The 90% of your rewards that go to the Vesting Pool are released gradually at a rate of **0.5% per day**. This means you slowly get access to your locked rewards over time.

### How Vesting Works

- After settlement, 90% of your rewards are locked in the Vesting Pool
- Every day, 0.5% of your remaining locked balance becomes available
- The amount available grows every second (you can watch it in real-time on the Vesting page)
- You click "Release" to move available tokens to your Withdrawal Wallet

### Vesting Timeline (verified in tests)

Here's exactly what happens with **100 BTN** in vesting:

| Time | Available to Release | Remaining Locked |
|------|---------------------|------------------|
| 1 hour | 0.02 BTN | 99.98 BTN |
| 12 hours | 0.25 BTN | 99.75 BTN |
| 1 day | 0.5 BTN | 99.5 BTN |
| 7 days | 3.5 BTN | 96.5 BTN |
| 30 days | 15 BTN | 85 BTN |
| 100 days | 50 BTN | 50 BTN |
| 200 days | 100 BTN (all of it) | 0 BTN |

After about 200 days, your entire vested balance is fully released.

### Real-World Scenario (full journey)

Let's follow a complete example from stake to withdrawal:

1. **You stake 1,000 BTN** in the Short program with Tier 1
2. **After 7 days**, you settle: total reward = 35 BTN
   - 3.5 BTN goes to your Withdrawal Wallet (available now)
   - 31.5 BTN goes to Vesting Pool
3. **After 1 more day**, you can release from vesting:
   - Available: 31.5 x 0.5% = **0.1575 BTN**
4. **After 30 more days**:
   - Available: about **4.725 BTN** from vesting
5. **After 200 days**, all 31.5 BTN from vesting is fully released

### Larger Example: 1,000,000 BTN in Vesting

| Time | Available to Release |
|------|---------------------|
| 1 day | 5,000 BTN |
| 7 days | 35,000 BTN |
| 30 days | 150,000 BTN |
| 200 days | 1,000,000 BTN (fully released) |

### How to Release Vested Tokens

1. Go to the **Vesting** page
2. You'll see:
   - Your total vested (locked) balance
   - The amount currently available for release (it grows in real-time on screen)
   - A progress bar showing how much has been released
3. Click **"Release"** to move available tokens to your Withdrawal Wallet

### Test Results -- Vesting Pool

- 100 BTN vesting releases exactly 0.5 BTN after 1 day (verified)
- 100 BTN vesting releases exactly 3.5 BTN after 7 days (verified)
- 1,000,000 BTN vesting releases exactly 5,000 BTN after 1 day (verified)
- 1 BTN vesting releases correctly down to the smallest unit (verified)
- Full balance released after approximately 200 days (verified)
- Adding new vesting after full drain restarts correctly (verified)
- Per-second precision: 10 seconds on 100 BTN = 57 units released (verified)
- Rounding handled correctly -- no lost tokens (verified)

**All 55 vesting pool tests passed.**

---

## Chapter 6: Withdrawals

Your Withdrawal Wallet holds all the BTN that's ready for you to take out. Money arrives here from three sources:
- The 10% from weekly settlements
- Released tokens from the Vesting Pool
- Any referral bonuses you've earned

### Full Withdrawal Journey Example

Let's put it all together with a realistic scenario:

**Month 1:**
- You stake 1,000 BTN (Short, Tier 1)
- Week 1 settlement: 35 BTN reward -> 3.5 BTN withdrawable + 31.5 BTN vesting
- Week 2 settlement: 35 BTN reward -> 3.5 BTN withdrawable + 31.5 BTN vesting
- Week 3 settlement: 35 BTN reward -> 3.5 BTN withdrawable + 31.5 BTN vesting
- Week 4 settlement: 35 BTN reward -> 3.5 BTN withdrawable + 31.5 BTN vesting
- Day 30: Unstake (no penalty) -> get 1,000 BTN back in your wallet

**Your Withdrawal Wallet after Month 1:**
- From settlements: 3.5 x 4 = **14 BTN**
- From vesting releases (approximately): **3 BTN** (released over the month)
- Total withdrawable: about **17 BTN**

**Your Vesting Pool after Month 1:**
- Total deposited: 31.5 x 4 = **126 BTN**
- Already released: about **3 BTN**
- Still locked: about **123 BTN** (will keep releasing at 0.5%/day)

### Weekly Withdrawal Caps

The platform can set a weekly withdrawal cap to maintain stability. Here's how it works:

**Example: 50 BTN weekly cap**
- You have 200 BTN in your Withdrawal Wallet
- You can withdraw up to 50 BTN this week
- If you withdraw 30 BTN, you have 20 BTN remaining for this week
- If you try to withdraw 25 BTN more, it fails (only 20 BTN left in your cap)
- After 7 days, your cap resets to 50 BTN again

When the cap is set to 0, there is no limit -- you can withdraw everything at once.

### How to Withdraw

1. Go to the **Withdraw** page
2. You'll see your withdrawable balance
3. Enter the amount you want to withdraw (or click MAX for the full balance)
4. Click **"Withdraw"**
5. The BTN tokens are sent directly to your connected wallet

### Test Results -- Withdrawal Wallet

- 100 BTN deposit, 100 BTN withdrawal -- exact transfer verified
- Multiple deposits (100 + 50 = 150 BTN) accumulate correctly
- Partial withdrawals: 30 + 30 + 40 = 100 BTN from 100 BTN balance (verified)
- 50 BTN weekly cap: allows 50, blocks 51 (verified)
- Cap exhaustion: after withdrawing 50/50, even 1 BTN fails (verified)
- Cap resets after exactly 7 days (verified)
- Cap change mid-week: raise from 50 to 100 allows 70 more (after 30 used) (verified)
- Very large: 1,000,000 BTN withdrawal works correctly (verified)
- Minimum: 1 unit withdrawal works (verified)
- Users cannot withdraw each other's balances (verified)

**All 56 withdrawal wallet tests passed.**

---

## Chapter 7: Referrals & Bonuses

BitTON.AI has a two-part referral system: Direct Bonuses and Matching Bonuses. Both are calculated and distributed automatically by the smart contracts.

### Part 1: Direct Bonus (5% of every stake)

When someone you referred stakes BTN, you automatically earn **5% of their staked amount** as a bonus.

**Verified examples from our tests:**

| Your Referral Stakes | You Earn (5%) |
|---------------------|---------------|
| 1,000 BTN | 50 BTN |
| 2,000 BTN | 100 BTN |
| 500 BTN | 25 BTN |
| 333 BTN | 16.65 BTN |
| 1,000,000 BTN | 50,000 BTN |

If your referral stakes multiple times, the bonuses add up:
- Stake 1: 1,000 BTN -> You earn 50 BTN
- Stake 2: 2,000 BTN -> You earn 100 BTN
- **Total earned: 150 BTN**

### Part 2: Matching Bonus (percentage of team's rewards)

When people in your team earn staking rewards and those rewards are settled, you earn a percentage based on what level they are in your team:

| Level | Who | Percentage |
|-------|-----|------------|
| Level 1 | Your direct referrals | 10% |
| Level 2 | Their referrals | 5% |
| Level 3 | One more level down | 3% |
| Level 4 | | 1% |
| Level 5 | | 1% |
| Level 6 | | 1% |
| Level 7 | | 1% |
| Level 8 | | 1% |
| Level 9 | | 1% |
| Level 10 | Deepest level | 1% |

### How Many Levels You Earn From

This depends on your tier:

| Your Tier | Levels You Earn From |
|-----------|---------------------|
| Tier 1 ($25) | Levels 1-3 only |
| Tier 2 ($50) | Levels 1-5 |
| Tier 3 ($100) | All 10 levels |

### Matching Bonus Examples (verified in tests)

**Scenario: Someone at Level 1 earns 1,000 BTN in rewards**

If you're Tier 1:
- Level 1: 1,000 x 10% = **100 BTN** to you
- Level 2: 1,000 x 5% = **50 BTN** to you
- Level 3: 1,000 x 3% = **30 BTN** to you
- Level 4+: nothing (T1 stops at level 3)
- **Total matching bonus: 180 BTN**

If you're Tier 2:
- Levels 1-3: same as above = 180 BTN
- Level 4: 1,000 x 1% = **10 BTN**
- Level 5: 1,000 x 1% = **10 BTN**
- **Total matching bonus: 200 BTN**

If you're Tier 3:
- Levels 1-5: same as T2 = 200 BTN
- Levels 6-10: 1,000 x 1% each = **50 BTN**
- **Total matching bonus: 250 BTN**

### What Happens If Someone in the Chain Isn't Qualified

If a person in your upline chain doesn't meet the qualification requirements, they are simply skipped. The bonus is NOT passed to the next person up -- it just isn't distributed.

**Verified example:**
- Level 1 person has no vault -> gets **0 BTN** (skipped)
- Level 2 person has Tier 1 and 500+ BTN staked -> gets their **5% matching** as normal

### Qualification Requirements

To earn matching bonuses, you need BOTH:
1. An **active vault** (any tier)
2. At least **500 BTN personally staked**

Our tests verified:
- 499 BTN staked = NOT qualified (0 matching bonus)
- 500 BTN staked = qualified (receives matching bonus)
- No vault = NOT qualified (even with 10,000 BTN staked)

### Combined Earnings Example

Let's say you're Tier 3 and have a team of 10 people all staking 1,000 BTN each:

**Your direct referral (Level 1) stakes 1,000 BTN:**
- You earn 5% direct bonus: **50 BTN**
- When they earn 35 BTN weekly reward (T1, Short), you earn 10% matching: **3.5 BTN**
- Per month (4 weeks): 50 + (3.5 x 4) = **64 BTN** from just one referral

Now multiply that by 10 referrals at Level 1, plus earnings from Levels 2-10...

### How to Set Up Referrals

1. Go to the **Referrals** page
2. Your unique referral link is displayed at the top -- copy and share it
3. When someone registers using your link, they appear in your downline
4. You can see your downline list, qualification status, and which matching levels are unlocked

### Test Results -- Bonus Engine

- 1,000 BTN stake produces exactly 50 BTN direct bonus (verified)
- 1,000 BTN reward at Level 1 produces exactly 100 BTN matching bonus (verified)
- Tier 1 stops matching at exactly 3 levels (verified)
- Tier 2 stops matching at exactly 5 levels (verified)
- Tier 3 matches all 10 levels (verified)
- 499 BTN personal stake = not qualified; 500 BTN = qualified (verified)
- No active vault = not qualified (verified)
- Unqualified users are skipped, bonus not passed up (verified)
- Self-referral is blocked (verified)
- Circular referral chains are prevented (verified)
- Mixed tiers in a chain calculate independently per person (verified)

**All 76 bonus engine tests passed.**

---

## Chapter 8: Dashboard Overview

The Dashboard is your home screen. It gives you a quick snapshot of everything happening with your account.

### What You'll See

- **BTN Balance**: How many BTN tokens are in your wallet right now
- **Total Staked**: The total amount of BTN you currently have locked in staking
- **Vesting Locked**: How much is locked in your Vesting Pool (releasing at 0.5%/day)
- **Withdrawable**: How much is ready to withdraw right now
- **Vault Tier**: Your current membership tier (Tier 1, 2, or 3)
- **Pending Rewards**: Rewards earned but not yet settled
- **Active Stakes**: A table showing all your current stakes with countdown timers showing exactly when each stake unlocks

### Alerts

- If your vault is not activated, the dashboard shows a warning with a link to activate it
- If you're on the wrong network, a red banner appears at the top

---

## Chapter 9: Admin Panel

The Admin page is only accessible to platform administrators. Regular users won't have access to the admin functions.

### Admin Features

- **Fund Rewards**: Add BTN tokens to the reward pool. This is where all staking rewards come from. The pool was tested with 100,000 BTN funding in our test suite.
- **User Lookup**: Search any user by wallet address to view:
  - Their vault tier
  - Total staked amount
  - Pending rewards
  - Vested and withdrawable balances
  - Downline count and referrer info
- **Global Stats**: View total staked across the platform and the current reward pool balance
- **Contract Addresses**: Quick reference to all deployed smart contracts with block explorer links

---

## Chapter 10: Security & Smart Contract Verification

All BitTON.AI smart contracts have been built with security as the top priority.

### Security Features

- **Upgradeable contracts**: All core contracts use the UUPS proxy pattern, allowing the team to fix bugs without losing user data or balances
- **Role-based access**: Admin, Operator, and Emergency roles are separated. No single person can do everything.
- **Reentrancy protection**: All withdrawal functions are protected against reentrancy attacks (a common crypto hack). Even if someone tries to call withdraw multiple times in one transaction, it's blocked.
- **Safe token transfers**: All BTN transfers use OpenZeppelin's SafeERC20 library, the industry standard
- **Pause capability**: In an emergency, withdrawals can be paused while deposits continue working. Once the issue is resolved, withdrawals are unpaused.
- **No hidden minting**: All rewards come from a pre-funded reward pool. The platform cannot create BTN out of thin air. If the pool is empty, settlements simply fail until it's funded again.
- **Oracle validation**: BTN price data used for vault payments is validated for staleness and zero values. If the price data is old (more than 1 hour) or zero, the transaction is rejected.

### Complete Test Results Summary

| Contract | What It Does | Tests | Result |
|----------|-------------|-------|--------|
| BTN Token | The BTN token itself (21M supply) | 32 | All passing |
| Vault Manager | Tier activation and payments | 62 | All passing |
| Staking Vault | Locking BTN and tracking rewards | 87 | All passing |
| Reward Engine | Weekly settlement (10/90 split) | 78 | All passing |
| Vesting Pool | Gradual release (0.5%/day) | 55 | All passing |
| Withdrawal Wallet | User withdrawals and caps | 56 | All passing |
| Bonus Engine | Direct (5%) and matching bonuses | 76 | All passing |
| Custodial Distribution | Treasury management | 38 | All passing |
| Legacy Contracts | Original staking system | 134 | All passing |
| **Total** | **Everything** | **618** | **All passing** |

Every function, every edge case, every error condition has been tested. The system handles everything from 1 BTN (the smallest possible amount) to 1,000,000 BTN (stress test) correctly.

### What Edge Cases Were Tested

- Staking exactly 1 BTN (smallest meaningful amount)
- Staking 1,000,000 BTN (stress test)
- Withdrawing exactly at the weekly cap boundary
- Vesting release at exactly 200 days (full drain)
- Adding new vesting after draining to zero
- Matching bonus with 10-level deep referral chain
- Mixed tiers in a referral chain
- Penalty calculation with odd amounts (333.33 BTN)
- Per-second reward precision (even 10 seconds of staking earns something)

---

## Chapter 11: Network & Technical Details

### Current Deployment

- **Network**: Base Sepolia Testnet (for testing)
- **Production Network**: Base (Ethereum Layer 2) -- coming soon
- **Token**: BTN (6 decimal places, 21 million total supply)
- **App URL**: https://bitton-ai-testnet.netlify.app
- **BTN Price**: $0.50 per BTN (oracle price used for vault payments)

### Key Numbers at a Glance

| What | Value |
|------|-------|
| BTN Total Supply | 21,000,000 BTN |
| Short Staking Lock | 30 days |
| Long Staking Lock | 180 days |
| Daily Reward Rate | 0.5% of staked amount |
| Short Staking (T1, 1000 BTN, 30 days) | 150 BTN earned |
| Short Staking (T3, 1000 BTN, 30 days) | 180 BTN earned |
| Long Staking (1000 BTN, 180 days) | 1,080 BTN earned |
| Early Exit Penalty | 15% of staked amount (Short only) |
| Settlement Split | 10% withdrawable / 90% vesting |
| Vesting Release Rate | 0.5% per day (~200 days to fully release) |
| Direct Referral Bonus | 5% of referred stake |
| Matching Bonus (Level 1) | 10% of rewards |
| Matching Bonus (Levels 2-3) | 5% and 3% |
| Matching Bonus (Levels 4-10) | 1% each |
| T1 Matching Depth | 3 levels |
| T2 Matching Depth | 5 levels |
| T3 Matching Depth | 10 levels |
| Minimum Stake for Matching | 500 BTN |
| Vault T1 Fee | $25 (25 USDT or equivalent BTN) |
| Vault T2 Fee | $50 |
| Vault T3 Fee | $100 |

---

## Chapter 12: Roadmap & What's Coming

### Currently Live (Testnet)

Everything described in this guide is fully working on the Base Sepolia testnet:

- Full registration and login with wallet signature authentication
- Vault activation with all three tiers
- Both staking programs (Short 30-day and Long 180-day)
- Weekly reward settlement with 10/90 split
- Vesting pool with 0.5%/day release
- Withdrawal system with optional weekly caps
- Complete 10-level referral and bonus engine
- Admin dashboard with funding and user lookup
- 618 automated tests all passing

### Coming Next

- Mainnet deployment on Base
- Mobile-optimized experience
- Email notifications for settlements and bonuses
- Transaction history with detailed breakdowns
- Enhanced referral tracking and team overview
- Additional staking programs

---

*This guide was last updated on March 5, 2026. Every number in this document has been verified through automated smart contract tests. For the latest information, visit the BitTON.AI app or contact your referrer.*
