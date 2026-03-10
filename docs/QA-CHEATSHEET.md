# BitTON.AI — Q&A Cheat Sheet for Presentation

**Use this to answer any question during the presentation.**

---

## GENERAL QUESTIONS

### Q: What is BitTON.AI?
**A:** A DeFi staking and referral platform on Base blockchain (Coinbase's L2). Users stake BTN tokens, earn daily rewards, and build referral networks. Originally on TON blockchain, now migrated to Base for better ecosystem access and lower costs.

### Q: Why did we move from TON to Base?
**A:** Base offers: (1) Much cheaper transactions ($0.001 vs $0.01), (2) Mature developer tools (Solidity/Hardhat), (3) Massive wallet ecosystem (MetaMask, Coinbase Wallet), (4) Coinbase regulatory backing, (5) Access to all Ethereum DeFi (Uniswap, Aave, etc.), (6) Better scaling infrastructure.

### Q: Is the web app working right now?
**A:** The frontend is live on Vercel. The backend needs a quick restart on Render (free tier sleeps). Smart contracts are deployed and verified on Base Sepolia testnet. For mainnet, we need a security audit first.

### Q: How many users can this handle?
**A:** Smart contracts have no user limit — Base L2 handles unlimited scale. Backend architecture is designed to scale from current to 1 billion users through horizontal scaling (adding more servers), database sharding, and caching layers. Each scaling tier is documented with exact costs.

---

## SMART CONTRACT QUESTIONS

### Q: Are the contracts audited?
**A:** We have 618 automated tests with 98% code coverage, including 56 security attack tests. A professional external audit (Cyfrin, OpenZeppelin, or Trail of Bits) is required before mainnet deployment. Cost: $15K-80K depending on firm.

### Q: Can contracts be upgraded?
**A:** Yes. All 6 core contracts use UUPS proxy pattern (OpenZeppelin standard). The admin can upgrade contract logic without changing addresses or losing user data. For mainnet, upgrades will require multisig (2-of-3) + timelock (24-48 hour delay) for safety.

### Q: What happens if there's a bug?
**A:** Every contract has an emergency pause function. An EMERGENCY_ROLE can pause all operations instantly. Contracts are UUPS-upgradeable, so bugs can be patched. For mainnet, we'll also have a bug bounty program on Immunefi.

### Q: How are rewards funded?
**A:** No hidden minting. The owner pre-funds BTN into the RewardEngine contract. Settlement reverts if the pool is empty. This is a key security invariant — users can verify on-chain that rewards are backed.

### Q: What's the APR?
**A:** Base rate: 0.5% daily = ~182.5% APR. With tier multipliers: T1=182.5%, T2=200.75%, T3=219% APR. Long staking always gets 1.2x multiplier regardless of tier.

### Q: What prevents rug pulls?
**A:** (1) No hidden minting — rewards from pre-funded pool only, (2) All contracts verified on Basescan — anyone can read the code, (3) ReentrancyGuard on all withdrawals, (4) AccessControl with role separation, (5) Future: multisig + timelock for admin actions, (6) External security audit before mainnet.

---

## BACKEND QUESTIONS

### Q: What does the backend do vs smart contracts?
**A:**
- **Backend handles:** User authentication (login/register), email/Telegram verification, referral code management, TON migration coordination, admin operations, data aggregation for frontend
- **Smart contracts handle:** All financial logic — staking, rewards, vesting, withdrawals, bonuses, vault activation. This is the trustless layer that users can verify on-chain.

### Q: What database do you use?
**A:** PostgreSQL (hosted on Neon). 11 tables covering users, sessions, migrations, jobs, and audit logs. Indexed for performance, designed for horizontal scaling.

### Q: How does authentication work?
**A:** Three methods: (1) EVM wallet signature (instant), (2) Email + OTP + wallet, (3) Telegram widget + wallet. All methods require a wallet signature as the final step. Sessions use JWT tokens (15-min access + 7-day refresh).

### Q: Is the email system working?
**A:** The code supports Resend, SendGrid, and SMTP. Currently needs an API key configured. Fix takes 30 minutes and costs $0 (Resend free tier: 100 emails/day).

### Q: How does the migration work for existing TON users?
**A:** One-click process: (1) Admin imports TON balance snapshot, (2) User logs in and links their TON wallet to their new EVM wallet, (3) Backend automatically builds migration claims, (4) CustodialDistribution contract sends BTN to user's EVM wallet. User just connects wallet and clicks "Migrate" — everything else is automated. Total cost for 60,000 users: ~$23.

---

## FRONTEND QUESTIONS

### Q: What devices does it work on?
**A:** Fully responsive — desktop, tablet, mobile. Dark theme. Works on all modern browsers (Chrome, Safari, Firefox, Edge). Wallet connection supports MetaMask, WalletConnect (200+ wallets), Coinbase Wallet, Rainbow.

### Q: Is there a mobile app?
**A:** Currently a responsive web app (works great on mobile browsers). A native React Native app can be built in Phase 2. The web app is the priority for launch.

### Q: What's the tech stack?
**A:** Next.js 14 (React), Tailwind CSS, wagmi + RainbowKit for wallet integration, React Query for data fetching. Deployed on Vercel with global CDN.

### Q: Why is it slow sometimes?
**A:** Two issues: (1) Render free tier sleeps after inactivity — backend takes 30-60 seconds to wake up, (2) Some API endpoints make sequential RPC calls instead of parallel. Both are fixable: upgrade Render ($7/month) and optimize the code.

---

## TOKENOMICS QUESTIONS

### Q: What is the BTN token?
**A:** ERC20 token on Base. 21 million max supply (like Bitcoin's 21M), 6 decimals (like USDT). Non-inflationary — no additional tokens can ever be minted beyond 21M.

### Q: How do vault tiers work?
**A:** Users pay a one-time fee to activate their vault: T1=$25, T2=$50, T3=$100. Payable in USDT or BTN (converted via Chainlink oracle). Higher tiers unlock: higher staking multipliers, deeper referral matching levels.

### Q: What's the referral system?
**A:** Two-level referral bonuses: (1) **Direct bonus:** 5% of referred user's stake goes to referrer, (2) **Matching bonus:** 10 levels deep — L1=10%, L2=5%, L3=3%, L4-L10=1% of downline's settled rewards. Requires active vault + 500 BTN minimum stake to qualify.

### Q: Where do rewards come from?
**A:** The RewardEngine is pre-funded with BTN tokens by the admin. When rewards are settled, they come from this pool. If the pool is empty, settlement reverts. This ensures 100% backing of all rewards — no Ponzi mechanics.

### Q: What's the vesting mechanism?
**A:** When rewards are settled weekly, 10% goes to user's withdrawal wallet (immediately available) and 90% goes to the vesting pool. Vesting releases at 0.5% per day. This creates a sustainable, gradual distribution.

---

## MIGRATION QUESTIONS

### Q: How do we migrate 60,000 users from TON?
**A:** Automated pipeline: (1) Import TON balance snapshot (CSV/JSON), (2) Users visit web app and link their TON wallet to EVM wallet, (3) Backend matches snapshots to linked wallets, (4) Batch migration sends BTN tokens to users via CustodialDistribution contract. 200 users per batch, 300 batches total. Cost: ~$23 in gas on Base.

### Q: Is migration one-click for users?
**A:** Yes. The user just: (1) Opens BitTON.AI, (2) Connects their EVM wallet, (3) Clicks "Migrate from TON" and enters their TON address, (4) BTN tokens appear in their wallet automatically once the admin processes the batch. No complex steps.

### Q: What if a user doesn't migrate?
**A:** Their balance remains in the CustodialDistribution contract indefinitely. They can migrate at any time — there's no deadline. The contract holds the full 21M BTN allocation.

### Q: Can someone fake their TON balance?
**A:** The snapshot is admin-controlled (imported from the old TON system). For mainnet, TON signature verification will be implemented so users prove ownership of their TON wallet. Currently this is a TODO item (4 hours of development).

---

## COST QUESTIONS

### Q: How much does it cost to run right now?
**A:** $0/month. Everything is on free tiers (Vercel, Render, Neon, Base Sepolia).

### Q: How much to go to mainnet?
**A:** Budget path: ~$25,000-30,000 (Cyfrin audit + minimal liquidity + deployment). Standard path: ~$60,000-70,000 (OpenZeppelin audit + good liquidity). Premium: ~$150,000+ (Trail of Bits + deep liquidity + legal review).

### Q: What's the monthly burn rate after launch?
**A:** Starts at ~$50-200/month for 0-10K users. Scales to ~$450/month for 100K users, ~$6,000/month for 1M users. Infrastructure costs grow linearly with users.

### Q: How much does migration cost?
**A:** ~$23-43 total for all 60,000 users. Base L2 transactions are extremely cheap ($0.001-0.01 each).

### Q: How much to fix the email system?
**A:** $0 (code already supports Resend API — just need to add the API key). Resend free tier gives 100 emails/day. Pro plan ($20/month) for 50K emails/month.

---

## SECURITY QUESTIONS

### Q: What if someone tries to hack the contracts?
**A:** Multiple layers: (1) ReentrancyGuard prevents re-entrance attacks, (2) SafeERC20 prevents token transfer failures, (3) AccessControl prevents unauthorized access, (4) Pausable allows instant emergency shutdown, (5) Oracle validation prevents price manipulation, (6) 56 security attack tests verify all defenses.

### Q: Who controls the admin keys?
**A:** Currently a single deployer wallet. For mainnet, this will be upgraded to Gnosis Safe multisig (2-of-3 or 3-of-5 signers required) with a 24-48 hour timelock on critical operations.

### Q: What about smart contract bugs?
**A:** UUPS proxy pattern allows upgrading contract logic. Combined with multisig + timelock, any bug can be patched without user intervention. Users don't need to migrate — the proxy address stays the same.

### Q: Is user data safe?
**A:** Passwords are bcrypt-hashed. JWT tokens are HS256-signed with a secret key. Sessions are database-backed (can be revoked). Rate limiting prevents brute force. Helmet middleware adds security headers. CORS is locked to the frontend domain.

---

## TECHNICAL ARCHITECTURE QUESTIONS

### Q: Why Base instead of Ethereum mainnet?
**A:** Base is 100x cheaper ($0.001 vs $0.10+ per transaction), 10x faster (2s vs 12s finality), and backed by Coinbase. Same security guarantees (Ethereum L2), same Solidity code, same wallets.

### Q: Why UUPS proxy instead of transparent proxy?
**A:** UUPS is more gas-efficient (upgrade logic is in the implementation, not the proxy), and it's the OpenZeppelin recommended pattern for new deployments.

### Q: How do contracts talk to each other?
**A:** Via interfaces + OPERATOR_ROLE grants. Example: When RewardEngine settles, it calls VestingPool.addVesting() and WithdrawalWallet.addWithdrawable(). These calls are authorized by the OPERATOR_ROLE that RewardEngine holds on those contracts.

### Q: What's the relayer?
**A:** A backend hot wallet that signs and submits transactions for admin operations (migration, reward funding, etc.). Users sign their own transactions directly from their wallets.

---

*Keep this document handy during the presentation for instant answers.*
