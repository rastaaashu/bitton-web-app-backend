# BitTON.AI — Internal Security Audit Report

**Date:** March 10, 2026
**Auditor:** Claude Code (AI-assisted)
**Scope:** Smart contracts, backend, frontend, migration system

---

## 1. SMART CONTRACT SECURITY

### 1.1 Attack Vectors Tested (56 tests, all pass)

| Category | Tests | Result |
|----------|-------|--------|
| Access control bypass | 15 | All rejected |
| Reentrancy attacks | 2 | ReentrancyGuard effective |
| Economic exploits (double-claim, over-withdraw) | 12 | All rejected |
| Edge cases (zero amounts, invalid inputs) | 13 | All handled |
| Gas griefing (oversized batches) | 2 | All handled |
| Post-finalization security | 5 | Permanent lockdown confirmed |
| Staking exploits | 4 | All rejected |
| BTN token security | 5 | All rejected |

### 1.2 Security Patterns Applied

| Pattern | Where | Implementation |
|---------|-------|---------------|
| ReentrancyGuard | All contracts with token transfers | `nonReentrant` modifier |
| SafeERC20 | All ERC20 operations | `safeTransfer`, `safeTransferFrom` |
| Checks-Effects-Interactions | `unstake()`, `settleWeekly()`, `withdraw()`, `release()` | State modified before external calls |
| AccessControl | All contracts | 3 roles: ADMIN, OPERATOR, EMERGENCY |
| Pausable | All contracts | EMERGENCY can pause, ADMIN can unpause |
| UUPS Upgradeable | 6 core contracts | Only ADMIN can upgrade |
| Storage Gaps | All upgradeable contracts | `uint256[50] private __gap` |
| Oracle Validation | VaultManager | Staleness, zero-price, round completeness, decimal range |

### 1.3 Key Invariants Verified

1. **No hidden minting**: RewardEngine rewards only from pre-funded pool
2. **Reward pool accounting**: `rewardPoolBalance -= totalReward` before any transfer
3. **Total staked tracking**: `totalStaked` incremented on stake, decremented on unstake
4. **One-time referrer**: `referrer[msg.sender] != address(0)` reverts on re-registration
5. **Circular referral prevention**: Walks chain up to MAX_CHAIN_DEPTH=100
6. **Tier-only upgrade**: `tier < userTier[msg.sender]` reverts on downgrade
7. **Finalization permanence**: All admin roles renounced, can never be recovered

### 1.4 Potential Risks (Mitigated)

| Risk | Mitigation | Residual Risk |
|------|-----------|--------------|
| Flash loan oracle manipulation | Chainlink oracle (not AMM-based) | LOW — Chainlink is industry standard |
| Admin key compromise | Future: Gnosis Safe multisig + timelock | MEDIUM until multisig deployed |
| Unbounded stake arrays | Each stake costs real BTN transfer (self-limiting) | LOW |
| Matching bonus chain depth | MAX_CHAIN_DEPTH=100 cap | NONE |
| Settlement gas limit | Per-user (not batch), reasonable stake counts | LOW |

---

## 2. BACKEND SECURITY

### 2.1 Authentication

| Feature | Implementation | Status |
|---------|---------------|--------|
| JWT algorithm | HS256 pinned (no algorithm confusion) | SECURE |
| Password hashing | bcrypt (10 salt rounds) | SECURE |
| OTP generation | `crypto.randomInt(100000, 999999)` | SECURE |
| Wallet challenge | `crypto.randomBytes(32)`, DB-stored, 5-min expiry | SECURE |
| Challenge consumption | Deleted after use (no replay) | SECURE |
| Admin API key | `crypto.timingSafeEqual` comparison | SECURE |
| Telegram hash | `crypto.timingSafeEqual` comparison | SECURE |
| Session management | DB-backed, revocable, 7-day expiry | SECURE |
| Rate limiting | Global (100/min) + auth (20/15min) + OTP (5/15min) + migration (10/5min) | SECURE |

### 2.2 Input Validation

| Endpoint Type | Validation | Status |
|--------------|-----------|--------|
| Auth (9 schemas) | Zod with strict types | COMPLETE |
| EVM addresses | `/^0x[a-fA-F0-9]{40}$/` | VALIDATED |
| Email addresses | Zod `.email()` | VALIDATED |
| UUIDs | Zod `.uuid()` | VALIDATED |
| OTP codes | Zod `.length(6).regex(/^\d{6}$/)` | VALIDATED |
| Sponsor codes | Zod `.regex(/^[a-zA-Z0-9_-]+$/)` | VALIDATED |
| Pagination | `Math.min(limit, 100)` capped | VALIDATED |

### 2.3 Infrastructure Security

| Feature | Implementation | Status |
|---------|---------------|--------|
| Helmet | CSP, HSTS, referrer policy, X-Content-Type-Options | ENABLED |
| CORS | Locked to APP_URL, credentials required | ENABLED |
| Body size limit | 1 MB max | ENABLED |
| X-Powered-By | Disabled | ENABLED |
| Request tracing | UUID-based request IDs | ENABLED |
| Error handling | Generic 500 for unhandled errors (no stack traces) | ENABLED |
| Graceful shutdown | SIGINT/SIGTERM handlers | ENABLED |
| Expired data cleanup | Every 30 minutes | ENABLED |

### 2.4 Database Security

| Feature | Implementation | Status |
|---------|---------------|--------|
| SQL injection | Prisma ORM (parameterized queries) | PROTECTED |
| Data at rest | Neon PostgreSQL (encrypted) | PROTECTED |
| Sensitive fields | Passwords bcrypt-hashed, tokens UUID-based | PROTECTED |
| Audit trail | `audit_log` table with actor, action, detail | ENABLED |

### 2.5 Remaining Recommendations

1. Add Redis (Upstash) for session store + rate limit state
2. Configure email service (Resend API key)
3. Add KMS for relayer private key (don't store in env vars for mainnet)
4. Add Sentry for error monitoring
5. Add request body logging for audit (redact sensitive fields)

---

## 3. FRONTEND SECURITY

### 3.1 Checks Performed

| Check | Result | Notes |
|-------|--------|-------|
| `dangerouslySetInnerHTML` | NOT FOUND | No XSS via innerHTML |
| Hardcoded secrets | NOT FOUND | Only public contract addresses |
| `eval()` usage | NOT FOUND | No code injection risk |
| Open redirects | NOT FOUND | All navigation uses Next.js router |
| Sensitive data in localStorage | JWT tokens only | Standard SPA pattern |
| Token logging | NOT FOUND | No console.log of tokens |
| User input sanitization | React's default escaping | All user inputs rendered safely |
| Double-submit prevention | State machines on all tx flows | isSubmitting/isBusy guards |

### 3.2 Security Features

| Feature | Implementation |
|---------|---------------|
| Error boundaries | React class component, catches render errors |
| In-app browser detection | Telegram, Instagram detection with user guidance |
| Network mismatch | Wrong-chain banner with switch button |
| Transaction state machine | Prevents approve/activate/stake double-submit |
| Wallet validation | Address format validation on admin page |
| Protected routes | Auth guard with wallet connection check |

### 3.3 Remaining Recommendations

1. Add CSP meta tags via `next.config.js` headers
2. Add Subresource Integrity (SRI) for external scripts
3. Add E2E tests with Playwright
4. Consider HttpOnly cookies for JWT (instead of localStorage) for mainnet

---

## 4. MIGRATION SECURITY

### 4.1 Attack Vectors Addressed

| Attack | Prevention | Status |
|--------|-----------|--------|
| Fake TON wallet | TonConnect ton_proof (Ed25519 signature) | PROTECTED |
| Replay attack | One-time challenge, 5-min expiry | PROTECTED |
| Double-claim | DB uniqueness + on-chain `hasMigrated()` check | PROTECTED |
| TON→EVM reuse | Each TON address can only link to one EVM address | PROTECTED |
| EVM→TON reuse | Each EVM address can only link to one TON address | PROTECTED |
| Snapshot manipulation | Admin-controlled import, validation (duplicates, max supply) | PROTECTED |
| Balance inflation | Cross-reference on-chain TON balance with snapshot | PROTECTED |
| Dev endpoint in production | `link-wallet-dev` returns 403 in production | PROTECTED |

### 4.2 Migration Flow Security

```
1. User calls POST /migration/challenge
   └─ Backend generates random 256-bit challenge
   └─ Stored in memory with 5-min TTL

2. Frontend sends challenge to TonConnect
   └─ TON wallet signs ton_proof (Ed25519)

3. User calls POST /migration/link-wallet
   └─ Backend verifies:
      a. Challenge exists and not expired
      b. Challenge matches proof payload (anti-replay)
      c. Domain matches (anti-phishing)
      d. Timestamp is recent (5 min)
      e. Ed25519 signature is valid
      f. TON address not already linked
      g. EVM address not already linked
   └─ Challenge consumed (one-time)
   └─ Wallet link created with verified=true
   └─ Snapshot balance checked and reported
```

---

## 5. OVERALL SECURITY RATING

| Component | Rating | Notes |
|-----------|--------|-------|
| Smart Contracts | A | 619 tests, 56 security tests, 95%+ coverage, zero-address guards |
| Backend | A | Full auth hardening, timing-safe OTP, no user enumeration leaks |
| Frontend | A- | CSP headers, production error masking, needs E2E tests |
| Migration | A | Cryptographic verification, anti-fraud measures |
| Infrastructure | C | Free tier, no monitoring — needs upgrade for mainnet |

### Pre-Mainnet Requirements
1. **External security audit** — CRITICAL (industry standard for DeFi)
2. **Multisig + timelock** — CRITICAL (admin key protection)
3. **KMS for relayer key** — HIGH (don't store in env vars)
4. **Monitoring (Sentry)** — HIGH (error detection)
5. **Always-on backend** — HIGH (user experience)

---

## 6. POST-AUDIT FIXES (March 11, 2026)

| Finding | Severity | Fix Applied |
|---------|----------|-------------|
| OTP timing attack (string `!==` comparison) | HIGH | Replaced with `crypto.timingSafeEqual` in both OTP verification paths |
| User enumeration via `isNewUser` field | MEDIUM | Removed from all auth responses, replaced with `authenticated: true` |
| BonusEngine setters accept zero address | MEDIUM | Added `require(_addr != address(0))` to `setRewardEngine`, `setVaultManager`, `setStakingVault` |
| Error boundary leaks raw error messages | LOW | Gated `error.message` display behind `NODE_ENV === "development"` |
| Frontend missing CSP headers | MEDIUM | Added comprehensive CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy to `next.config.js` |

**All fixes verified:** 619/619 contract tests pass, backend TypeScript clean, frontend builds clean (15 pages).

---

*This is an internal AI-assisted audit. An external professional audit (Cyfrin, OpenZeppelin, or Trail of Bits) is required before mainnet deployment.*
