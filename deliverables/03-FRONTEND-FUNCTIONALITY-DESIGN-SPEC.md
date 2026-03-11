# BitTON.AI — Frontend Functionality & Design Specification
**For: Design Team (Figma / UI/UX)**
**Date: 2026-03-11**
**Version: 1.0**

---

## 1. Purpose

This document describes every screen, block, and interactive element of the BitTON.AI web application. Use it as the reference to create the new visual design in Figma. The functionality is fixed — only the visual design (colors, typography, spacing, icons, illustrations) should change.

---

## 2. Global Layout

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER BAR                            │
│  [Logo]  [Network Badge: Base Sepolia ●]  [BTN Rate: $2.25] │
│                            [User Email/Address] [Logout]     │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ SIDEBAR  │              MAIN CONTENT AREA                    │
│          │                                                   │
│ Quick    │  (Changes per page — see sections below)          │
│ Stats    │                                                   │
│          │                                                   │
│ Nav      │                                                   │
│ Menu     │                                                   │
│          │                                                   │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### 2.2 Header Bar

| Element | Position | Behavior |
|---------|----------|----------|
| Logo | Left | Static, links to /dashboard |
| Network Badge | Center-left | Shows "Base Sepolia" with green live dot; shows "Wrong Network" warning with switch button if wrong chain |
| **BTN Exchange Rate** | **Center** | **Static display: "1 BTN = $2.25" (linked to platform rate)** |
| **Convert Button** | **Next to rate** | **Toggle: switches all BTN amounts on page to USD equivalent and back** |
| User Display | Right | Shows email or truncated wallet address (responsive) |
| Logout Button | Far right | Signs out, clears session |

### 2.3 Sidebar

**Quick Stats Block (top of sidebar):**
- BTN Balance (number)
- Vault Tier (colored badge: T1=blue, T2=purple, T3=amber, None=gray)
- Total Staked (number)

**Navigation Menu (10 items):**

| # | Label | Icon | Route |
|---|-------|------|-------|
| 1 | Dashboard | Grid/Home icon | `/dashboard` |
| 2 | Vault | Shield icon | `/vault` |
| 3 | Staking | Layers icon | `/staking` |
| 4 | Rewards | Star icon | `/rewards` |
| 5 | Vesting | Clock icon | `/vesting` |
| 6 | Withdraw | Download icon | `/withdraw` |
| 7 | Referrals | Users icon | `/referrals` |
| 8 | History | List icon | `/history` |
| 9 | Settings | Gear icon | `/settings` |
| 10 | Admin | Shield-check icon | `/admin` (only visible to admins) |

**Active state:** Highlighted background + accent color on active page.

**Mobile behavior:**
- Sidebar hidden by default
- Hamburger menu button in header (top-left)
- Opens as overlay with dark backdrop
- Closes on navigation or backdrop click

---

## 3. Public Pages (Unauthenticated)

### 3.1 Login Page (`/login`)

**Layout:** Centered card on full-screen background

**Elements:**
1. **Logo + Title** — "BitTON.AI" heading
2. **Risk Disclaimer Checkbox** — Required before any auth method activates
   - Text: "I acknowledge the risks associated with DeFi protocols..."
   - Must be checked to enable login buttons
3. **Three Auth Method Tabs:**

   **Tab 1: EVM Wallet**
   - "Connect Wallet" button (RainbowKit modal)
   - On connect: auto-signs challenge message
   - Shows connected address with green dot when connected

   **Tab 2: Email**
   - Step 1: Email input field + "Send OTP" button
   - Step 2: 6-digit OTP input + "Verify" button + "Resend OTP" link
   - Step 3: "Connect Wallet" button to link wallet

   **Tab 3: Telegram**
   - Telegram Login Widget button
   - After Telegram auth: "Connect Wallet" button

4. **Bottom link:** "Don't have an account? Register"

### 3.2 Register Page (`/register`)

**Layout:** Same centered card as login

**Elements:**
1. **Logo + Title** — "Create Account"
2. **Referral Code Input** — Required field
   - Input field + "Validate" button
   - Shows green checkmark when validated
   - Shows red error if invalid
3. **Risk Disclaimer Checkbox** (same as login)
4. **Three Auth Method Tabs** (same as login, but calls register endpoints)
5. **Bottom link:** "Already have an account? Login"

---

## 4. Dashboard Page (`/dashboard`)

**The main overview page after login.**

### 4.1 Stats Cards Row (4 cards)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Wallet       │ │ Total        │ │ Vesting      │ │ Withdrawable │
│ Balance      │ │ Staked       │ │ Locked       │ │              │
│              │ │              │ │              │ │              │
│ 20,000,000   │ │ 19,000       │ │ 500          │ │ 250          │
│ BTN          │ │ BTN          │ │ BTN          │ │ BTN          │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

Each card shows:
- Label (small, gray)
- Value (large, bold number)
- Unit ("BTN")
- Loading skeleton while fetching

### 4.2 Vault Status Banner

**If vault NOT active:**
```
┌────────────────────────────────────────────────────────────────┐
│ ⚠ Your vault is not active. Activate a vault to start earning │
│ rewards.                                    [Activate Vault →] │
└────────────────────────────────────────────────────────────────┘
```

**If vault active:**
- Shows tier badge (e.g., "Tier 3" with amber color)
- Shows pending rewards amount

### 4.3 Active Stakes Table

| Column | Description |
|--------|-------------|
| Type | "Short (30d)" or "Long (180d)" |
| Amount | BTN staked |
| Started | Date |
| Lock End | Date |
| Time Left | Live countdown (days:hours:minutes) |
| Status | "Active" (green) or "Completed" (gray) |

Countdown timer updates in real-time. Pauses when browser tab is hidden (performance).

---

## 5. Vault Page (`/vault`)

### 5.1 Tier Selection Cards (3 cards side by side)

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    TIER 1         │ │    TIER 2         │ │    TIER 3         │
│                   │ │                   │ │                   │
│    $25            │ │    $50            │ │    $100           │
│                   │ │                   │ │                   │
│ Multiplier: 1.0x  │ │ Multiplier: 1.1x  │ │ Multiplier: 1.2x  │
│ Matching: 3 lvls  │ │ Matching: 5 lvls  │ │ Matching: 10 lvls │
│                   │ │                   │ │                   │
│ [Select]          │ │ [Select]          │ │ [Select]          │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Current tier highlighted** with badge/border. Higher tiers show upgrade option.

### 5.2 Payment Section (appears after tier selection)

**Two payment options (toggle/radio):**

| Option | Display |
|--------|---------|
| Pay with USDT | Shows fee in USDT (e.g., "$100.00 USDT"), shows wallet USDT balance |
| Pay with BTN | Shows fee in BTN (converted via oracle, e.g., "~200 BTN"), shows wallet BTN balance |

**Two-step flow:**
1. **Step 1: Approve** — "Approve [USDT/BTN]" button
2. **Step 2: Activate** — "Activate Vault" button (enabled after approval)

Auto-advances to step 2 when allowance is sufficient.

### 5.3 Current Vault Status

If already active: Shows tier badge, activation date, and "Current Tier: X" prominently.

---

## 6. Staking Page (`/staking`)

### 6.1 Program Toggle

Two-option toggle: **[Short (30 days)]** | **[Long (180 days)]**

### 6.2 Stake Input Section

| Element | Description |
|---------|-------------|
| Amount input | Number field with BTN label |
| MAX button | Fills with wallet BTN balance |
| Reward estimate | "Daily: ~X BTN / Weekly: ~X BTN" (calculated from amount × rate × multiplier) |
| Info panel | Side-by-side comparison of Short vs Long program details |

**Two-step flow:**
1. "Approve BTN" button
2. "Confirm Stake" button

### 6.3 Program Info Panel

```
┌─────────────────────────┐ ┌─────────────────────────┐
│ SHORT PROGRAM            │ │ LONG PROGRAM             │
│                          │ │                          │
│ Lock: 30 days            │ │ Lock: 180 days           │
│ Rate: 0.5% daily         │ │ Rate: 0.5% daily         │
│ Multiplier: Tier-based   │ │ Multiplier: 1.2x (fixed) │
│ Early exit: Yes (15%     │ │ Early exit: No            │
│   penalty)               │ │                          │
└─────────────────────────┘ └─────────────────────────┘
```

### 6.4 Active Stakes Table

| Column | Description |
|--------|-------------|
| Type | Short / Long |
| Amount | BTN staked |
| Started | Date |
| Lock End | Date |
| Time Left | Live countdown |
| Status | Active / Completed |
| Actions | [Unstake] button |

**Unstake Modal (on click):**
- Shows stake details
- If Short + early: Warning "15% early exit penalty will apply"
- If Long + locked: "Cannot exit early. Lock period: X days remaining"
- Confirm / Cancel buttons

---

## 7. Rewards Page (`/rewards`)

### 7.1 Stats Cards (3 cards)

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Pending          │ │ Last Settlement   │ │ Reward Pool      │
│ Rewards          │ │                   │ │ Balance          │
│                  │ │                   │ │                  │
│ 150.50 BTN       │ │ 2026-03-10 14:00  │ │ 8,500 BTN        │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 7.2 Settlement Preview

```
┌────────────────────────────────────────────────┐
│ Settlement Preview                              │
│                                                 │
│ Total Pending:           150.50 BTN             │
│ → 10% Withdrawable:      15.05 BTN             │
│ → 90% Vesting:          135.45 BTN             │
│                                                 │
│              [Settle Rewards]                   │
└────────────────────────────────────────────────┘
```

**Warning if vault not active:** "Activate a vault first to settle rewards."

---

## 8. Vesting Page (`/vesting`)

### 8.1 Stats Cards (3 cards)

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Vested           │ │ Available to      │ │ Daily Release    │
│ (Locked)         │ │ Release           │ │ Rate             │
│                  │ │                   │ │                  │
│ 1,350.00 BTN     │ │ 6.75 BTN          │ │ 6.75 BTN/day     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 8.2 Live Release Counter

**Key feature:** A counter that updates every second showing accumulating release amount.

```
┌────────────────────────────────────────────────┐
│ Vesting Release                                 │
│                                                 │
│ Available to release:  6.750042 BTN  (live ↑)   │
│                                                 │
│ Release rate: 0.0000781 BTN/second              │
│                                                 │
│ [==============================--------]  75%   │
│  Progress bar showing release progress           │
│                                                 │
│          [Release Vested Tokens]                │
└────────────────────────────────────────────────┘
```

The counter increments every second based on `(vestedBalance × 0.5%) / 86400` per second.

---

## 9. Withdraw Page (`/withdraw`)

### 9.1 Simple Layout

```
┌────────────────────────────────────────────────┐
│ Withdraw BTN                                    │
│                                                 │
│ Withdrawable Balance:  250.00 BTN               │
│                                                 │
│ Amount: [_______________] [MAX]                  │
│                                                 │
│ Tokens will be sent to your connected wallet.   │
│                                                 │
│              [Withdraw BTN]                     │
└────────────────────────────────────────────────┘
```

Input validates: max 6 decimals, cannot exceed balance.

---

## 10. Referrals Page (`/referrals`)

### 10.1 Your Referral Link

```
┌────────────────────────────────────────────────┐
│ Your Referral Link                              │
│                                                 │
│ https://bitton.ai/register?ref=0xABC...123      │
│                                          [Copy] │
│                                                 │
│ Custom Name: [_______________] [Save]           │
│ (Choose a short name for your referral link)    │
│ e.g., "superman2026" → bitton.ai/ref/superman2026 │
└────────────────────────────────────────────────┘
```

**NEW FEATURE (from meeting):** Users can set a custom short name for their referral link.
- Input field for custom name
- Uniqueness check (if taken, show "already taken")
- Once set, displays both long URL and short URL

### 10.2 Referral Stats (4 stat cards)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Downline      │ │ Matching     │ │ Qualified     │ │ Personal     │
│ Count         │ │ Depth        │ │               │ │ Staked       │
│               │ │              │ │               │ │              │
│ 24            │ │ 10 levels    │ │ Yes ✓         │ │ 1,500 BTN   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Qualified** = Active vault + 500 BTN personal stake (shows Yes/No).

### 10.3 Matching Bonus Levels Table

| Level | Bonus % | Status |
|-------|---------|--------|
| 1 | 10% | Unlocked ✓ |
| 2 | 5% | Unlocked ✓ |
| 3 | 3% | Unlocked ✓ |
| 4 | 1% | Locked 🔒 (T3 required) |
| 5 | 1% | Locked 🔒 |
| ... | ... | ... |
| 10 | 1% | Locked 🔒 |

Locked levels shown grayed out with lock icon. Unlocked based on user's tier.

### 10.4 Downline List

Scrollable list showing:
- Truncated wallet address (clickable → opens on BaseScan)
- Position/level in tree

---

## 11. History Page (`/history`)

### 11.1 Transaction Table

| Column | Description |
|--------|-------------|
| Type | Staked, Unstaked, Withdrawn, VestingAdded, VestingReleased, Settlement, DirectBonus, MatchingBonus |
| Amount | BTN amount |
| Date | Timestamp |
| Tx Hash | Truncated hash, clickable → BaseScan |

**States:**
- Loading: Spinner/skeleton
- Empty: "No transactions yet"
- Error: "Failed to load" with retry

---

## 12. Settings Page (`/settings`)

### 12.1 Account Info Card

| Field | Value |
|-------|-------|
| User ID | UUID |
| Account Status | CONFIRMED (green badge) |
| Auth Method | Wallet / Email / Telegram |
| Member Since | Date |
| Last Login | Date + time |

### 12.2 Linked Auth Methods

```
┌────────────────────────────────────────────────┐
│ Linked Authentication Methods                   │
│                                                 │
│ EVM Wallet    0xABC...123          ✓ Linked     │
│ Email         user@example.com     ✓ Linked     │
│ Telegram      @username            [Link →]     │
└────────────────────────────────────────────────┘
```

Each method shows:
- Icon + Label
- Value (address/email/telegram ID)
- Status: "Linked" (green) or "Link" button

**Link Email Modal:**
1. Enter email
2. Verify OTP

**Link Telegram Modal:**
1. Click Telegram widget
2. Confirm

### 12.3 Sponsor Codes

Shows user's auto-generated sponsor codes with usage count.

### 12.4 Sign Out Button

Red button at bottom. Clears session and redirects to login.

---

## 13. Admin Page (`/admin`)

**Only visible to admin wallets (DEFAULT_ADMIN_ROLE on contracts).**

### 13.1 System Overview Cards

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Global Staked     │ │ Reward Pool      │ │ Admin Address    │
│                   │ │ Balance          │ │                  │
│ 500,000 BTN       │ │ 8,500 BTN        │ │ 0xABC...123      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 13.2 Fund Reward Pool

```
┌────────────────────────────────────────────────┐
│ Fund Reward Pool                                │
│                                                 │
│ Amount: [_______________] BTN                   │
│                                                 │
│ [Approve BTN]  →  [Fund Rewards]               │
└────────────────────────────────────────────────┘
```

Two-step: Approve → Fund.

### 13.3 User Lookup

```
┌────────────────────────────────────────────────┐
│ User Lookup                                     │
│                                                 │
│ Address: [0x___________________________] [Search]│
│                                                 │
│ Results:                                        │
│ - Wallet Balance: X BTN                         │
│ - Vault: Tier 3 (Active)                        │
│ - Total Staked: X BTN                           │
│ - Pending Rewards: X BTN                        │
│ - Vested Balance: X BTN                         │
│ - Withdrawable: X BTN                           │
│ - Referrer: 0x...                               │
│ - Downline Count: X                             │
└────────────────────────────────────────────────┘
```

### 13.4 Contract Addresses Reference

Table of all deployed contract addresses with clickable BaseScan links.

**DESIGN NOTE:** This should NOT be prominently displayed. Place in a collapsible/accordion section or "Advanced" tab. Per meeting feedback: "We need to hide this" — it's for admin reference only.

---

## 14. Common UI Components

### 14.1 Stat Card

```
┌────────────────────┐
│ Label (small, gray) │
│                     │
│ Value (large, bold) │
│ Subtitle (optional) │
└────────────────────┘
```

Supports loading skeleton state.

### 14.2 Transaction Button (TxButton)

**States:**
1. **Idle:** Primary color, label text
2. **Pending:** Spinner + "Confirming..." text, disabled
3. **Success:** Green + checkmark + "Confirmed!" + tx hash link
4. **Error:** Red + "Failed" + retry prompt

**Variants:** Primary (blue), Secondary (gray), Danger (red)

### 14.3 Modal

Centered overlay with dark backdrop. Title bar + content + action buttons.

### 14.4 Toast Notifications (Sonner)

Bottom-right corner. Types: success (green), error (red), info (blue).

---

## 15. Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Mobile (<768px) | Hidden sidebar, hamburger menu, single column, compact cards |
| Tablet (768-1024px) | Collapsible sidebar, 2-column grid |
| Desktop (>1024px) | Fixed sidebar, 4-column grid, full tables |

---

## 16. Color Scheme (Current — to be redesigned)

| Element | Current Color | Notes |
|---------|--------------|-------|
| Background | Dark (gray-900) | Dark theme |
| Cards | Gray-800 | Slightly lighter than background |
| Primary accent | Blue-500 | Buttons, links |
| Success | Green-500 | Confirmations, active states |
| Warning | Yellow-500 | Warnings, vault not active |
| Danger | Red-500 | Errors, penalties |
| T1 badge | Blue | Tier 1 |
| T2 badge | Purple | Tier 2 |
| T3 badge | Amber/Gold | Tier 3 |

**Design team is free to completely redesign colors, keeping tier color differentiation.**

---

## 17. New Features Requested (from meeting)

These features are NOT yet implemented but should be included in the new design:

### 17.1 BTN Exchange Rate Display (Header)
- Show "1 BTN = $2.25" in the header
- Add a toggle/button to convert all BTN amounts on the page to USD equivalent

### 17.2 Custom Referral Short Names
- On the Referrals page, allow users to set a custom short name
- Uniqueness check (selector — if taken, show error)
- Display: `bitton.ai/ref/customname`
- Future: Add profile picture/avatar/NFT linked to the short name

### 17.3 Two-Factor Auth Requirement
- Registration requires wallet (mandatory) + one of (email OR telegram)
- Show this clearly in the registration flow
- Settings page should prominently show which second factor is linked

### 17.4 Separate Admin Dashboard
- Future: Admin should have a completely separate page/URL (not inside user app)
- Should use username/password authentication (not wallet)
- Should be shareable with marketing team, financial department
- For now: keep current in-app admin but plan for separation

### 17.5 Referral Link Shortening
- All referral links should be short and clean
- Format: `bitton.ai/ref/SHORTCODE`
- Not the full URL with query parameters

---

## 18. Design Assets Needed

| Asset | Purpose | Format |
|-------|---------|--------|
| Logo | Header, login page, favicon | SVG + PNG |
| Tier icons (T1/T2/T3) | Vault cards, badges | SVG |
| Navigation icons (10) | Sidebar menu items | SVG (24x24) |
| Background pattern/gradient | Login/register pages | CSS/SVG |
| Loading skeleton | Card/table loading states | CSS animation |
| Empty state illustrations | No data screens | SVG |
| Success/error icons | Transaction states | SVG |
| Mobile app icon | PWA / bookmark | PNG (512x512) |

---

## 19. Figma Page Structure (Suggested)

```
Page 1: Design System
  - Colors, typography, spacing, shadows
  - Component library (buttons, cards, inputs, modals, badges)

Page 2: Public Pages
  - Login (desktop + mobile)
  - Register (desktop + mobile)

Page 3: Dashboard & Core
  - Dashboard (desktop + mobile)
  - Vault activation (desktop + mobile)
  - Staking (desktop + mobile)

Page 4: Rewards & Finance
  - Rewards (desktop + mobile)
  - Vesting (desktop + mobile)
  - Withdraw (desktop + mobile)

Page 5: Social & Profile
  - Referrals (desktop + mobile)
  - History (desktop + mobile)
  - Settings (desktop + mobile)

Page 6: Admin
  - Admin dashboard (desktop)

Page 7: States & Overlays
  - Loading states
  - Error states
  - Empty states
  - Modals (unstake, link email, link telegram)
  - Toast notifications
  - Wrong network warning
```
