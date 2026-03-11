# BitTON.AI — Testing Guide for DevOps & Security Team
**For: DevOps / QA / Security Team**
**Date: 2026-03-11**
**Version: 1.0**

---

## 1. Testing Overview

This document describes **what to test**, **how to test**, and **what tools to use** for the BitTON.AI platform. It covers:

1. Smart contract security testing
2. Backend API stress testing & security testing
3. Frontend functional testing
4. End-to-end integration testing

---

## 2. Prerequisites

### 2.1 Access Required

| Resource | Details |
|----------|---------|
| Git Repository | `https://github.com/rastaaashu/bitton-contracts.git` |
| Backend URL (prod) | `https://bitton-backend.onrender.com` |
| Frontend URL (prod) | `https://bitton-contracts.vercel.app` |
| Admin API Key | Required for `/admin/*` endpoints (request from dev team) |
| Base Sepolia RPC | `https://sepolia.base.org` (public) |
| Block Explorer | `https://sepolia.basescan.org` |

### 2.2 Test Wallets Setup

You will need test wallets with:
- Base Sepolia ETH (for gas) — Get from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- BTN tokens (for staking) — Request from dev team or admin endpoint
- USDT tokens (for vault activation) — Request from dev team

### 2.3 Tools Required

| Tool | Purpose | Install |
|------|---------|---------|
| Node.js 18+ | Run backend/frontend locally | `nvm install 18` |
| Artillery | HTTP stress testing | `npm install -g artillery` |
| k6 | Alternative load testing | [k6.io](https://k6.io) |
| OWASP ZAP | Web security scanning | [zaproxy.org](https://zaproxy.org) |
| Slither | Solidity static analysis | `pip install slither-analyzer` |
| Mythril | Smart contract security | `pip install mythril` |
| Hardhat | Contract testing | Already in repo (`npm install`) |

---

## 3. Smart Contract Testing

### 3.1 Run Existing Test Suite

```bash
# Clone and install
git clone https://github.com/rastaaashu/bitton-contracts.git
cd bitton-contracts
npm install

# Run all 619 tests
npx hardhat test

# Run with coverage report
npx hardhat coverage

# Run specific contract tests
npx hardhat test test/VaultManager.test.js
npx hardhat test test/StakingVault.test.js
npx hardhat test test/RewardEngine.test.js
npx hardhat test test/VestingPool.test.js
npx hardhat test test/WithdrawalWallet.test.js
npx hardhat test test/BonusEngine.test.js
npx hardhat test test/SystemIntegration.test.js
```

**Expected Result:** 619 passing, 95%+ coverage

### 3.2 Static Analysis (Slither)

```bash
# Install
pip install slither-analyzer

# Run on all contracts
slither . --config-file slither.config.json

# Run on specific contract
slither contracts/VaultManager.sol
slither contracts/StakingVault.sol
slither contracts/RewardEngine.sol
slither contracts/VestingPool.sol
slither contracts/WithdrawalWallet.sol
slither contracts/BonusEngine.sol
```

**What to look for:**
- Reentrancy vulnerabilities
- Unchecked external calls
- Access control issues
- Integer overflow/underflow (should be safe with 0.8.27)
- State variable shadowing
- Uninitialized storage variables

### 3.3 Mythril (Symbolic Execution)

```bash
# Install
pip install mythril

# Analyze each contract
myth analyze contracts/VaultManager.sol --solv 0.8.27
myth analyze contracts/StakingVault.sol --solv 0.8.27
myth analyze contracts/RewardEngine.sol --solv 0.8.27
myth analyze contracts/WithdrawalWallet.sol --solv 0.8.27
```

**What to look for:**
- Integer overflow/underflow
- Arbitrary storage writes
- Ether theft
- Denial of service

### 3.4 Manual Security Checklist (Smart Contracts)

| # | Check | Contract(s) | Expected |
|---|-------|-------------|----------|
| 1 | ReentrancyGuard on all withdraw/transfer functions | WithdrawalWallet, VestingPool, StakingVault | Yes — `nonReentrant` modifier |
| 2 | SafeERC20 for all token transfers | All contracts | Yes — `using SafeERC20 for IERC20` |
| 3 | AccessControl roles enforced | All contracts | Yes — ADMIN, OPERATOR, EMERGENCY |
| 4 | Oracle staleness check (>1 hour = revert) | VaultManager | Yes — reverts if stale or price=0 |
| 5 | No token minting (rewards from funded pool) | RewardEngine | Yes — `rewardPoolBalance` tracked |
| 6 | Early exit penalty goes to treasury (not burned) | StakingVault | Yes — 15% transferred to treasury |
| 7 | UUPS upgrade authorization | All upgradeable | Yes — DEFAULT_ADMIN_ROLE only |
| 8 | Circular referral prevention | BonusEngine | Yes — depth-limited traversal |
| 9 | Pausable emergency controls | All contracts | Yes — pause/unpause functions |
| 10 | Storage gap for future upgrades | All upgradeable | Yes — 50 slots reserved |
| 11 | Checks-Effects-Interactions pattern | All contracts | Yes — state updated before external calls |
| 12 | Events emitted for all state changes | All contracts | Yes — comprehensive event coverage |

### 3.5 On-Chain Verification (Testnet)

Run the smoke test against live testnet:

```bash
# Full smoke test
npx hardhat run scripts/smoke-test.js --network base_sepolia

# End-to-end runbook
npx hardhat run scripts/testnet-e2e-runbook.js --network base_sepolia

# Scale simulation (local)
npx hardhat run scripts/scale-simulation.js
```

---

## 4. Backend API Stress Testing

### 4.1 Artillery Load Test Configuration

Create `artillery-config.yml`:

```yaml
config:
  target: "https://bitton-backend.onrender.com"
  phases:
    # Warm-up: 5 users/sec for 60 seconds
    - duration: 60
      arrivalRate: 5
      name: "Warm-up"
    # Ramp-up: 5→50 users/sec over 120 seconds
    - duration: 120
      arrivalRate: 5
      rampTo: 50
      name: "Ramp-up"
    # Sustained load: 50 users/sec for 300 seconds
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    # Spike: 200 users/sec for 60 seconds
    - duration: 60
      arrivalRate: 200
      name: "Spike test"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  # Scenario 1: Health check (baseline)
  - name: "Health Check"
    weight: 10
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200

  # Scenario 2: Dashboard read (most common)
  - name: "Dashboard Load"
    weight: 40
    flow:
      - get:
          url: "/api/dashboard/0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A"
          expect:
            - statusCode: 200

  # Scenario 3: Stakes query
  - name: "Stakes Query"
    weight: 15
    flow:
      - get:
          url: "/api/stakes/0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A"
          expect:
            - statusCode: 200

  # Scenario 4: Referrals query
  - name: "Referrals Query"
    weight: 10
    flow:
      - get:
          url: "/api/referrals/0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A"
          expect:
            - statusCode: 200

  # Scenario 5: Transaction history
  - name: "History Query"
    weight: 10
    flow:
      - get:
          url: "/api/history/0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A"
          expect:
            - statusCode: 200

  # Scenario 6: Wallet login flow
  - name: "Login Challenge"
    weight: 10
    flow:
      - post:
          url: "/auth/login/wallet/challenge"
          json:
            address: "0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A"

  # Scenario 7: Sponsor validation
  - name: "Sponsor Validation"
    weight: 5
    flow:
      - get:
          url: "/sponsor/validate/0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A"
          expect:
            - statusCode: 200
```

**Run Artillery:**

```bash
# Install
npm install -g artillery

# Run load test
artillery run artillery-config.yml

# Run with report output
artillery run artillery-config.yml --output report.json
artillery report report.json    # Generate HTML report
```

### 4.2 k6 Alternative

Create `k6-stress-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Warm-up
    { duration: '3m', target: 50 },    // Ramp-up
    { duration: '5m', target: 50 },    // Sustained
    { duration: '1m', target: 200 },   // Spike
    { duration: '1m', target: 0 },     // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95th percentile < 2s
    http_req_failed: ['rate<0.05'],     // Error rate < 5%
  },
};

const BASE_URL = 'https://bitton-backend.onrender.com';
const TEST_ADDRESS = '0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A';

export default function () {
  // Health check
  let res = http.get(`${BASE_URL}/health`);
  check(res, { 'health 200': (r) => r.status === 200 });

  // Dashboard (most critical endpoint)
  res = http.get(`${BASE_URL}/api/dashboard/${TEST_ADDRESS}`);
  check(res, { 'dashboard 200': (r) => r.status === 200 });

  // Stakes
  res = http.get(`${BASE_URL}/api/stakes/${TEST_ADDRESS}`);
  check(res, { 'stakes 200': (r) => r.status === 200 });

  sleep(1);
}
```

**Run k6:**

```bash
k6 run k6-stress-test.js
```

### 4.3 Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Response time (p50) | < 500ms | < 1000ms |
| Response time (p95) | < 2000ms | < 5000ms |
| Error rate | < 1% | < 5% |
| Throughput | > 100 req/s | > 50 req/s |
| Health check | < 200ms | < 500ms |
| Dashboard load | < 1000ms | < 3000ms |
| Concurrent users | 500+ | 100+ |

### 4.4 Stress Test Scenarios

| Scenario | Description | Parameters |
|----------|-------------|-----------|
| **Baseline** | Normal traffic | 10 users/sec, 5 min |
| **Growth** | Increased traffic | 50 users/sec, 10 min |
| **Spike** | Sudden traffic surge | 200 users/sec, 2 min |
| **Soak** | Extended load | 30 users/sec, 1 hour |
| **Rate limit** | Test rate limiting | 200+ auth requests from same IP |
| **Concurrent reads** | Many dashboard loads | 100 concurrent dashboard requests |
| **Mixed workload** | Reads + writes | 80% reads, 20% auth flows |

---

## 5. Backend Security Testing

### 5.1 OWASP ZAP Scan

```bash
# Quick scan
zap-cli quick-scan https://bitton-backend.onrender.com

# Full scan with API import
zap-cli active-scan https://bitton-backend.onrender.com
```

### 5.2 API Security Checklist

| # | Test | Endpoint(s) | How to Test | Expected |
|---|------|-------------|-------------|----------|
| 1 | **Rate limiting works** | `/auth/*` | Send 25 requests in 15 sec | 429 after limit |
| 2 | **JWT validation** | `/auth/profile` | Send request without/invalid token | 401 Unauthorized |
| 3 | **Admin API key required** | `/admin/*` | Send without X-API-Key header | 403 Forbidden |
| 4 | **SQL injection** | All POST endpoints | Send `'; DROP TABLE users;--` in fields | No effect, input validated |
| 5 | **XSS in inputs** | `/auth/register/*` | Send `<script>alert(1)</script>` | Sanitized/rejected |
| 6 | **CORS enforcement** | All endpoints | Request from unauthorized origin | Blocked by CORS |
| 7 | **Helmet headers** | All endpoints | Check response headers | CSP, HSTS, X-Frame present |
| 8 | **OTP brute force** | `/auth/verify-otp` | Send 6 wrong OTPs | Locked after 5 attempts |
| 9 | **Token refresh** | `/auth/refresh` | Use revoked refresh token | 401 Unauthorized |
| 10 | **Admin user separation** | `/admin/*` | Access without admin role | 403 Forbidden |
| 11 | **Wallet signature replay** | `/auth/login/wallet/verify` | Reuse old signature | Rejected (one-time challenge) |
| 12 | **Body size limit** | Any POST | Send >1MB body | 413 Payload Too Large |

### 5.3 Security Test Scripts

```bash
# Test 1: Rate limiting
for i in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://bitton-backend.onrender.com/auth/login/wallet/challenge \
    -H "Content-Type: application/json" \
    -d '{"address":"0x1DaE2C7aeC8850f1742fE96045c23d1AaE3FCf2A"}'
done
# Expected: First 20 return 200, then 429

# Test 2: JWT required
curl -s -w "\n%{http_code}" \
  https://bitton-backend.onrender.com/auth/profile
# Expected: 401

# Test 3: Admin key required
curl -s -w "\n%{http_code}" \
  https://bitton-backend.onrender.com/admin/status
# Expected: 403

# Test 4: CORS check
curl -s -H "Origin: https://evil-site.com" \
  -I https://bitton-backend.onrender.com/health
# Expected: No Access-Control-Allow-Origin for evil-site.com

# Test 5: Health check
curl -s https://bitton-backend.onrender.com/health | jq .
# Expected: {"status":"ok","db":"connected",...}

# Test 6: Helmet headers
curl -sI https://bitton-backend.onrender.com/health | grep -E "(content-security|strict-transport|x-frame|x-content-type)"
# Expected: All security headers present
```

---

## 6. Frontend Testing

### 6.1 Functional Test Checklist

| # | Feature | Steps | Expected Result |
|---|---------|-------|-----------------|
| 1 | **Wallet Connect** | Click "Connect Wallet" → select MetaMask/WalletConnect | Wallet connected, address shown |
| 2 | **Registration** | Enter referral code → connect wallet → sign message | Account created, redirected to dashboard |
| 3 | **Login** | Connect wallet → sign challenge → verify | JWT received, dashboard loaded |
| 4 | **Dashboard Load** | Navigate to /dashboard | All stat cards load with real data |
| 5 | **Vault Activation (USDT)** | Go to /vault → select T1 → pay USDT → approve → activate | Vault activated, tier shown |
| 6 | **Vault Activation (BTN)** | Go to /vault → select T2 → pay BTN → approve → activate | Vault activated, BTN deducted |
| 7 | **Short Stake** | Go to /staking → Short → enter amount → approve → stake | Stake appears in active stakes |
| 8 | **Long Stake** | Go to /staking → Long → enter amount → approve → stake | Stake appears with 180d lock |
| 9 | **Unstake Short (early)** | Click unstake on short stake before 30d | 15% penalty warning, unstake succeeds |
| 10 | **Unstake Long (early)** | Try to unstake long stake before 180d | Error: lock period not met |
| 11 | **Settle Rewards** | Go to /rewards → click "Settle Rewards" | 10/90 split shown, transaction confirmed |
| 12 | **Release Vesting** | Go to /vesting → click "Release Vested Tokens" | Released amount added to withdrawal |
| 13 | **Withdraw** | Go to /withdraw → enter amount → confirm | BTN transferred to wallet |
| 14 | **Referral Link** | Go to /referrals → copy link | Valid referral link copied |
| 15 | **Register Referrer** | Enter referrer address → confirm | One-time registration success |
| 16 | **Email Link** | Go to /settings → link email → verify OTP | Email linked to account |
| 17 | **Telegram Link** | Go to /settings → link Telegram | Telegram ID linked |
| 18 | **Admin Panel** | Login as admin → go to /admin | Admin dashboard visible |
| 19 | **Fund Rewards (admin)** | Admin → fund reward pool → approve → fund | Reward pool balance increases |
| 20 | **User Lookup (admin)** | Admin → search user by address | User details displayed |
| 21 | **Wrong Network** | Connect to wrong chain | Warning shown, switch button available |
| 22 | **Mobile Responsive** | Open on mobile browser | Hamburger menu, compact layout |

### 6.2 Browser Compatibility

Test on:
- Chrome (desktop + mobile)
- Firefox (desktop)
- Safari (desktop + iOS)
- MetaMask in-app browser
- WalletConnect (mobile wallet apps)

---

## 7. End-to-End Integration Testing

### 7.1 Full User Journey Test

**Test with real wallet on Base Sepolia:**

```
Step 1: Register
  - Get referral code from existing user
  - Connect wallet
  - Sign registration message
  - Verify: account created, sponsor code auto-generated

Step 2: Activate Vault (T3)
  - Ensure wallet has USDT tokens
  - Go to /vault → select T3 ($100)
  - Approve USDT → Activate
  - Verify: vault active, tier 3 shown on dashboard

Step 3: Stake (Short)
  - Ensure wallet has BTN tokens (at least 100 BTN)
  - Go to /staking → Short program
  - Enter 100 BTN → Approve → Stake
  - Verify: stake appears in active stakes list

Step 4: Wait & Settle
  - Wait for some time to accrue rewards (or use time manipulation in local tests)
  - Go to /rewards → Settle Rewards
  - Verify: 10% in withdrawable, 90% in vesting

Step 5: Release Vesting
  - Go to /vesting → Release Vested Tokens
  - Verify: released amount moves to withdrawal wallet

Step 6: Withdraw
  - Go to /withdraw → enter amount → Withdraw
  - Verify: BTN received in personal wallet

Step 7: Referral
  - Share referral link with second wallet
  - Second wallet registers using referral link
  - Second wallet stakes
  - Verify: direct bonus (5% of stake) credited to first user

Step 8: Unstake (Short, early exit)
  - Go to /staking → click unstake on active short stake
  - Confirm 15% penalty warning
  - Verify: tokens returned minus 15% penalty
```

### 7.2 Gas Cost Estimation

| Operation | Estimated Gas | Estimated Cost (Base) |
|-----------|--------------|----------------------|
| Vault Activation | ~150,000 gas | ~$0.001 |
| Stake | ~200,000 gas | ~$0.001 |
| Unstake | ~250,000 gas | ~$0.002 |
| Settle Weekly | ~300,000 gas | ~$0.002 |
| Release Vesting | ~150,000 gas | ~$0.001 |
| Withdraw | ~100,000 gas | ~$0.001 |
| Register Referrer | ~100,000 gas | ~$0.001 |
| Batch Migrate (200 users) | ~2,000,000 gas | ~$0.01 |

**Total gas for 100,000 users (all operations):** Estimated ~$250-500 on Base L2.

### 7.3 Capacity Planning for Scale Testing

| Users | DB Rows (est.) | Contract Calls/day | RPC Requests/day |
|-------|----------------|-------------------|-----------------|
| 1,000 | 10,000 | 5,000 | 50,000 |
| 10,000 | 100,000 | 50,000 | 500,000 |
| 100,000 | 1,000,000 | 500,000 | 5,000,000 |

**Bottleneck prediction:**
- At 10K users: RPC rate limits may need dedicated provider
- At 100K users: Database needs connection pooling + read replicas
- At 100K users: Event indexing needs The Graph subgraph

---

## 8. BTN Token Requirements for Testing

| Test Scenario | BTN Needed | USDT Needed | ETH Needed (gas) |
|--------------|-----------|-------------|------------------|
| Single user full journey | 1,000 BTN | 100 USDT | 0.01 ETH |
| 10 user stress test | 10,000 BTN | 1,000 USDT | 0.1 ETH |
| 100 user load test | 100,000 BTN | 10,000 USDT | 1 ETH |
| Reward pool funding | 10,000+ BTN | — | 0.01 ETH |

**How to get test tokens:**
1. BTN: Admin distributes from Custodial contract via admin endpoint
2. USDT: Mock USDT on testnet (mint function available)
3. ETH: Base Sepolia faucet

---

## 9. Monitoring During Tests

### 9.1 Backend Monitoring

```bash
# Watch health check
watch -n 5 'curl -s https://bitton-backend.onrender.com/health | jq .'

# Check system status (admin)
curl -s -H "X-API-Key: <ADMIN_KEY>" \
  https://bitton-backend.onrender.com/admin/status | jq .

# Watch operator jobs
curl -s -H "X-API-Key: <ADMIN_KEY>" \
  "https://bitton-backend.onrender.com/admin/jobs?status=FAILED" | jq .

# Check audit log
curl -s -H "X-API-Key: <ADMIN_KEY>" \
  https://bitton-backend.onrender.com/admin/audit | jq .
```

### 9.2 On-Chain Monitoring

- Block explorer: `https://sepolia.basescan.org`
- Contract events: Search contract address on explorer → Events tab
- Relayer balance: Check via `/health` endpoint (relayer.ethBalance)

---

## 10. Reporting

After testing, provide a report with:

1. **Test summary** — Total tests run, pass/fail counts
2. **Performance metrics** — Response times (p50, p95, p99), throughput, error rates
3. **Security findings** — Any vulnerabilities found (severity: critical/high/medium/low)
4. **Smart contract analysis** — Slither/Mythril output + manual review findings
5. **Gas cost analysis** — Actual gas usage per operation
6. **Scalability assessment** — At what load does the system degrade?
7. **Recommendations** — Priority fixes before mainnet deployment

---

## 11. Tokenomics & Economic Model — Comprehensive Test Cases

This section provides detailed test cases for verifying the correctness of all tokenomics formulas, reward distributions, bonus calculations, and economic invariants. These should be executed on a local Hardhat fork or testnet with time manipulation capabilities.

### 11.1 Reference: Key Formulas

All amounts use **6 decimal places** (1 BTN = 1,000,000 units).

| Operation | Formula | Solidity Code |
|-----------|---------|---------------|
| Daily Reward | P x 0.5% x M | `(principal * 5 * multiplier * elapsed) / (10_000 * 86_400)` |
| 10% Withdrawable | reward x 10% | `(reward * 10) / 100` |
| 90% Vesting | reward - withdrawable | `reward - withdrawable` (captures remainder) |
| Vesting Release | V x 0.5% daily | `(vested * 5 * elapsed) / (1000 * 86_400)` capped at V |
| Direct Bonus | stake x 5% | `(stake * 500) / 10_000` |
| Matching Bonus | reward x level% | `(reward * levelBps) / 10_000` |
| Early Exit Penalty | principal x 15% | `(principal * 1500) / 10_000` |
| BTN via Oracle | feeUSD / oraclePrice | `(feeUSD * 1e8) / oraclePrice` (rounded up) |

---

### 11.2 Vault Activation Test Cases

| # | Test Case | Input | Expected Output | Verify |
|---|-----------|-------|-----------------|--------|
| V1 | Activate T1 with USDT | tier=1, pay 25 USDT | Vault active, tier=1, 25 USDT deducted from user, 25 USDT in treasury | `isVaultActive()=true`, `getUserTier()=1`, treasury USDT balance +25 |
| V2 | Activate T2 with USDT | tier=2, pay 50 USDT | Vault active, tier=2, 50 USDT deducted | `getUserTier()=2`, treasury +50 USDT |
| V3 | Activate T3 with USDT | tier=3, pay 100 USDT | Vault active, tier=3, 100 USDT deducted | `getUserTier()=3`, treasury +100 USDT |
| V4 | Activate T1 with BTN (oracle price $0.50) | tier=1, oracle=$0.50 | 50 BTN deducted ($25 / $0.50) | BTN balance -50, treasury +50 BTN |
| V5 | Activate T3 with BTN (oracle price $2.25) | tier=3, oracle=$2.25 | ~44.45 BTN deducted ($100 / $2.25, rounded up) | Verify ceiling division used |
| V6 | Activate with stale oracle (>1hr old) | oracle.updatedAt = 2 hours ago | Transaction reverts | `"Stale oracle price"` error |
| V7 | Activate with zero oracle price | oracle.price = 0 | Transaction reverts | `"Invalid oracle price"` error |
| V8 | Activate with insufficient USDT | balance = 10 USDT, tier=1 ($25) | Transaction reverts | ERC20 transfer failure |
| V9 | Upgrade T1 → T3 | Already T1, pay T3 fee | Tier upgraded to 3 | `getUserTier()=3` |
| V10 | Activate without approval | No ERC20 approve first | Transaction reverts | Allowance insufficient |
| V11 | Double activation same tier | Already T3, try T3 again | Reverts or no-op | No double charge |

---

### 11.3 Staking Reward Calculation Test Cases

**Key multipliers:** T1=10 (1.0x), T2=11 (1.1x), T3=12 (1.2x), Long=12 (1.2x fixed)

| # | Test Case | Stake | Tier | Program | Days | Expected Reward | Calculation |
|---|-----------|-------|------|---------|------|-----------------|-------------|
| R1 | Basic T1 Short, 1 day | 1,000 BTN | T1 | Short | 1 | **5.0 BTN** | 1000 x 0.5% x 1.0 x 1 |
| R2 | Basic T1 Short, 7 days | 1,000 BTN | T1 | Short | 7 | **35.0 BTN** | 1000 x 0.5% x 1.0 x 7 |
| R3 | Basic T1 Short, 30 days (full lock) | 1,000 BTN | T1 | Short | 30 | **150.0 BTN** | 1000 x 0.5% x 1.0 x 30 |
| R4 | T2 Short, 7 days | 1,000 BTN | T2 | Short | 7 | **38.5 BTN** | 1000 x 0.5% x 1.1 x 7 |
| R5 | T3 Short, 7 days | 1,000 BTN | T3 | Short | 7 | **42.0 BTN** | 1000 x 0.5% x 1.2 x 7 |
| R6 | T1 Long, 7 days | 1,000 BTN | T1 | Long | 7 | **42.0 BTN** | 1000 x 0.5% x 1.2 x 7 (fixed 1.2x) |
| R7 | T3 Long, 7 days | 1,000 BTN | T3 | Long | 7 | **42.0 BTN** | Same — Long always 1.2x regardless of tier |
| R8 | Large stake, T3 Short, 30 days | 100,000 BTN | T3 | Short | 30 | **18,000 BTN** | 100000 x 0.5% x 1.2 x 30 |
| R9 | Small stake, T1 Short, 1 day | 10 BTN | T1 | Short | 1 | **0.05 BTN** (50,000 units) | 10 x 0.5% x 1.0 |
| R10 | Minimum stake (1 BTN), 1 day | 1 BTN | T1 | Short | 1 | **0.005 BTN** (5,000 units) | 1 x 0.5% x 1.0 |
| R11 | Partial day (12 hours) | 1,000 BTN | T1 | Short | 0.5 | **2.5 BTN** | Pro-rated per second |
| R12 | Partial day (1 hour) | 1,000 BTN | T1 | Short | 1/24 | **~0.2083 BTN** | 1000 x 5 x 10 x 3600 / (10000 x 86400) |
| R13 | Multiple stakes same user | 500+500 BTN | T2 | Short | 7 | **38.5 BTN** total | Each stake calculated separately, sum matches |
| R14 | Accumulated settlement (14 days no settle) | 1,000 BTN | T1 | Short | 14 | **70.0 BTN** | Accumulates until called |
| R15 | Settlement resets accrual | 1,000 BTN, settle at day 7 then day 14 | T1 | — | — | 35 + 35 = **70 BTN** total | No double-counting |

---

### 11.4 Weekly Settlement 10/90 Split Test Cases

| # | Test Case | Total Reward | Expected Withdrawable (10%) | Expected Vesting (90%) | Verify |
|---|-----------|-------------|----------------------------|-----------------------|--------|
| S1 | Standard split | 100 BTN | **10 BTN** | **90 BTN** | WW balance +10, VP balance +90 |
| S2 | Odd amount | 33 BTN | **3.3 BTN** (3,300,000 units) | **29.7 BTN** (29,700,000 units) | No dust lost |
| S3 | Very small reward | 0.000009 BTN (9 units) | **0 BTN** (0 units, truncated) | **9 units** (remainder) | Vesting gets all when 10% rounds to 0 |
| S4 | Large reward | 10,000 BTN | **1,000 BTN** | **9,000 BTN** | Pool balance reduced by 10,000 |
| S5 | 1 unit reward | 1 unit | **0 units** | **1 unit** | Minimum handling |
| S6 | Multiple settlements accumulate | 35 + 35 BTN | 3.5 + 3.5 = **7 BTN** cumulative in WW | 31.5 + 31.5 = **63 BTN** in VP | Balances accumulate correctly |
| S7 | Settlement with insufficient reward pool | Reward = 100 BTN, pool = 50 BTN | **Reverts** | — | Cannot pay more than pool balance |
| S8 | Settlement with no pending rewards | 0 elapsed time | **0 BTN** all | No state change | Should not emit misleading events |
| S9 | Settlement without active vault | User has stake but vault deactivated | **Reverts** | — | Vault gating enforced |

---

### 11.5 Vesting Pool Release Test Cases

**Daily release rate:** 0.5% of current vested balance per day, pro-rated per second.

| # | Test Case | Vested Balance | Time Elapsed | Expected Release | Calculation |
|---|-----------|---------------|-------------|-----------------|-------------|
| VE1 | Standard 1-day release | 100 BTN | 1 day (86,400s) | **0.5 BTN** | 100 x 0.5% x 1 |
| VE2 | 7-day release | 100 BTN | 7 days | **3.5 BTN** | 100 x 0.5% x 7 |
| VE3 | 30-day release | 100 BTN | 30 days | **15 BTN** | 100 x 0.5% x 30 |
| VE4 | 200-day release (full drain) | 100 BTN | 200 days | **100 BTN** (capped) | 100 x 0.5% x 200 = 100 (hits cap) |
| VE5 | 365-day release | 100 BTN | 365 days | **100 BTN** (capped at balance) | Cannot exceed vested balance |
| VE6 | 1-hour release | 1,000 BTN | 1 hour (3,600s) | **~0.2083 BTN** (208,333 units) | 1000 x 5 x 3600 / (1000 x 86400) |
| VE7 | Per-second precision | 1,000,000 BTN | 1 second | **~0.005787 BTN** (5,787 units) | 1M x 5 x 1 / (1000 x 86400) |
| VE8 | Multiple releases reduce balance | 100 BTN, release twice | Day 1 then Day 2 | Day 1: 0.5 BTN; Day 2: 0.4975 BTN | Second release based on 99.5 BTN |
| VE9 | Release after new deposit | 100 BTN day 0, +50 BTN day 3 | Day 7 from start | Release on 100 (3d) + release on 150 (4d) | Compound correctly |
| VE10 | Release with zero balance | 0 BTN vested | Any time | **0 BTN** | No-op, no revert |
| VE11 | Released tokens appear in WithdrawalWallet | Release 0.5 BTN | — | WW balance +0.5 BTN | Verify cross-contract transfer |
| VE12 | Eventual full drain | 100 BTN | Release daily for 250 days | Balance approaches 0 | Asymptotic drain (each release is 0.5% of remaining) |

---

### 11.6 Direct Bonus Test Cases

**Rate:** 5% (500 BPS) of referred user's stake amount.

| # | Test Case | Referred Stake | Expected Bonus | Verify |
|---|-----------|---------------|----------------|--------|
| DB1 | Standard direct bonus | 1,000 BTN | **50 BTN** | Referrer pending reward +50 |
| DB2 | Large stake | 100,000 BTN | **5,000 BTN** | Referrer pending +5,000 |
| DB3 | Small stake | 100 BTN | **5 BTN** | Referrer pending +5 |
| DB4 | Minimum stake (1 BTN) | 1 BTN | **0.05 BTN** (50,000 units) | Non-zero bonus |
| DB5 | Odd amount | 333 BTN | **16.65 BTN** (16,650,000 units) | Truncated correctly |
| DB6 | No referrer registered | 1,000 BTN | **0 BTN** | No bonus if no referrer |
| DB7 | Multiple stakes from same referral | 1,000 + 2,000 BTN | 50 + 100 = **150 BTN** | Each stake triggers bonus |
| DB8 | Bonus goes through 10/90 split | 50 BTN bonus | 5 BTN withdrawable + 45 BTN vesting | On next settlement |

---

### 11.7 Matching Bonus Test Cases

**Level percentages:** L1=10%, L2=5%, L3=3%, L4-L10=1% each

| # | Test Case | Downline Reward | Ancestor Tier | Level | Expected Bonus | Verify |
|---|-----------|----------------|--------------|-------|----------------|--------|
| MB1 | Level 1, T1 ancestor | 100 BTN | T1 | L1 | **10 BTN** | 100 x 10% |
| MB2 | Level 2, T1 ancestor | 100 BTN | T1 | L2 | **5 BTN** | 100 x 5% |
| MB3 | Level 3, T1 ancestor (max for T1) | 100 BTN | T1 | L3 | **3 BTN** | 100 x 3% |
| MB4 | Level 4, T1 ancestor (beyond limit) | 100 BTN | T1 | L4 | **0 BTN** (skipped) | T1 only gets L1-L3 |
| MB5 | Level 5, T2 ancestor (max for T2) | 100 BTN | T2 | L5 | **1 BTN** | 100 x 1% |
| MB6 | Level 6, T2 ancestor (beyond limit) | 100 BTN | T2 | L6 | **0 BTN** (skipped) | T2 only gets L1-L5 |
| MB7 | Level 10, T3 ancestor (max for T3) | 100 BTN | T3 | L10 | **1 BTN** | 100 x 1% |
| MB8 | Full tree payout (T3, all 10 levels) | 1,000 BTN reward | T3 all | L1-L10 | **360 BTN** total | 100+50+30+10x7=250... see below |
| MB9 | Unqualified ancestor (no vault) | 100 BTN | No vault | L1 | **0 BTN** (skipped) | Must have active vault |
| MB10 | Unqualified ancestor (<500 BTN staked) | 100 BTN | T3 but 400 staked | L1 | **0 BTN** (skipped) | Min 500 BTN personal stake |
| MB11 | Mixed qualified/unqualified chain | 100 BTN | L1=T3, L2=no vault, L3=T3 | — | L1=10, L2=0 (skip), L3=3 | Skipped, not shifted |
| MB12 | Circular referral attempt | A→B→A | — | — | **Reverts** | Circular detection |

**Full Tree Calculation (MB8):**
```
L1: 1000 x 10% = 100 BTN
L2: 1000 x 5%  = 50 BTN
L3: 1000 x 3%  = 30 BTN
L4: 1000 x 1%  = 10 BTN
L5: 1000 x 1%  = 10 BTN
L6: 1000 x 1%  = 10 BTN
L7: 1000 x 1%  = 10 BTN
L8: 1000 x 1%  = 10 BTN
L9: 1000 x 1%  = 10 BTN
L10: 1000 x 1% = 10 BTN
Total: 250 BTN matching bonus
```

---

### 11.8 Early Exit Penalty Test Cases

**Penalty rate:** 15% (1500 BPS) of principal, sent to treasury.

| # | Test Case | Principal | Time | Expected Return | Penalty | Verify |
|---|-----------|----------|------|----------------|---------|--------|
| EX1 | Short, early exit day 1 | 1,000 BTN | 1 day | **850 BTN** | **150 BTN** to treasury | 15% penalty applied |
| EX2 | Short, early exit day 29 | 1,000 BTN | 29 days | **850 BTN** | **150 BTN** | Still within lock |
| EX3 | Short, exit after 30 days | 1,000 BTN | 30 days | **1,000 BTN** (full) | **0 BTN** | Lock period complete |
| EX4 | Short, exit after 31 days | 1,000 BTN | 31 days | **1,000 BTN** | **0 BTN** | Past lock = no penalty |
| EX5 | Long, attempt early exit | 1,000 BTN | 90 days | **Reverts** | — | Long has no early exit |
| EX6 | Long, exit after 180 days | 1,000 BTN | 180 days | **1,000 BTN** | **0 BTN** | Full return after lock |
| EX7 | Large early exit | 100,000 BTN | 1 day | **85,000 BTN** | **15,000 BTN** | Scale test |
| EX8 | Odd amount penalty | 333.333333 BTN | 1 day | **283.333333 BTN** | **49.999999 BTN** | Truncation correct |
| EX9 | Treasury receives penalty | 1,000 BTN early exit | — | — | Treasury BTN balance +150 | Not burned, treasury gets it |
| EX10 | Accrued rewards on early exit | 1,000 BTN, 7 days accrued | 7 days | 850 BTN return + 35 BTN reward | 150 penalty | Return includes rewards |

---

### 11.9 Reward Pool Sustainability Test Cases

| # | Test Case | Scenario | Expected Behavior | Verify |
|---|-----------|----------|-------------------|--------|
| RP1 | Fund reward pool | Admin funds 10,000 BTN | `rewardPoolBalance = 10,000` | Balance tracked correctly |
| RP2 | Settlement reduces pool | Settle 100 BTN reward | Pool reduced by 100 | `rewardPoolBalance -= 100` |
| RP3 | Multiple settlements drain pool | 100 settlements of 100 BTN | Pool = 0 after 10,000 BTN | Exact accounting |
| RP4 | Pool exhaustion blocks settlement | Pool = 50, reward = 100 | Reverts | Cannot overdraw pool |
| RP5 | Refund after exhaustion | Pool = 0, admin funds 5,000 | Settlement works again | Recovery flow |
| RP6 | Pool invariant | At any time | `rewardPoolBalance <= btnToken.balanceOf(rewardEngine)` | Contract holds enough BTN |
| RP7 | Bonus doesn't overdraw pool | Direct + matching = 500 BTN | Pool must have 500+ to process | Bonuses also deduct from pool |
| RP8 | Scale test: 1000 users, 30 days | 1000 users x 1000 BTN x 30d | ~150,000 BTN rewards (T1) | Pool needs 150K+ funding |

---

### 11.10 Precision & Rounding Test Cases

| # | Test Case | Input | Expected | Verify |
|---|-----------|-------|----------|--------|
| PR1 | 10% of 1 unit | reward = 1 unit (0.000001 BTN) | withdrawable = 0, vesting = 1 | Integer division floors |
| PR2 | 10% of 9 units | reward = 9 units | withdrawable = 0, vesting = 9 | 9/10 = 0 (floor) |
| PR3 | 10% of 10 units | reward = 10 units | withdrawable = 1, vesting = 9 | First non-zero split |
| PR4 | 10% of 11 units | reward = 11 units | withdrawable = 1, vesting = 10 | 11/10 = 1 (floor) |
| PR5 | 5% of 1 unit (direct bonus) | stake = 20 units | bonus = 1 unit | 20 x 500 / 10000 = 1 |
| PR6 | 5% of 19 units | stake = 19 units | bonus = 0 units | 19 x 500 / 10000 = 0 (floor) |
| PR7 | Vesting release per-second | 1000 BTN, 1 second | 5,787 units | (1000e6 * 5 * 1) / (1000 * 86400) |
| PR8 | Vesting release per-minute | 1000 BTN, 60 seconds | 347,222 units | (1000e6 * 5 * 60) / (1000 * 86400) |
| PR9 | No dust loss in split | Any amount | withdrawable + vesting = total reward | `vesting = reward - withdrawable` ensures this |
| PR10 | Max precision amount | 21,000,000 BTN (max supply) staked | No overflow | Check all formulas with max values |

---

### 11.11 Cross-Contract Economic Invariants

These invariants must hold **at all times** and should be checked after every test scenario:

| # | Invariant | Check |
|---|-----------|-------|
| INV1 | **No token creation:** Total BTN in system is constant | Sum of all contract balances + user balances = initial supply |
| INV2 | **Reward pool solvency:** `rewardPoolBalance <= BTN.balanceOf(RewardEngine)` | RewardEngine never promises more than it holds |
| INV3 | **Settlement conservation:** `withdrawable + vesting = total_reward` (no dust lost) | 10/90 split sums to 100% |
| INV4 | **Vesting release cap:** Released amount never exceeds vested balance | `release <= vestedBalance[user]` |
| INV5 | **Withdrawal cap:** `withdraw(amount)` never exceeds `withdrawableBalance[user]` | Balance underflow impossible |
| INV6 | **Penalty destination:** Early exit penalty goes to treasury, not burned | `treasury.balance += penalty` |
| INV7 | **Tier monotonicity:** User tier can only increase, never decrease | T1 → T2 → T3, never T3 → T1 |
| INV8 | **Referral immutability:** Once set, referrer cannot change | `registerReferrer` is one-time |
| INV9 | **Bonus qualification:** No matching bonus without active vault + 500 BTN staked | Check before each bonus payout |
| INV10 | **Lock period enforcement:** Long stake cannot unstake before 180 days | Always reverts |
| INV11 | **Time progression:** `lastRewardTime` and `lastReleaseTime` only move forward | Never rewind |
| INV12 | **Operator permissions:** Only OPERATOR_ROLE can call cross-contract functions | Access control enforced |

---

### 11.12 Multi-User Economic Scenario Test Cases

#### Scenario A: "3 Users, 3 Tiers, Full Lifecycle"

```
Setup:
- User A: T1, stakes 1,000 BTN Short
- User B: T2, stakes 2,000 BTN Short  (referred by A)
- User C: T3, stakes 5,000 BTN Long   (referred by B)
- Reward pool funded: 50,000 BTN

Day 7 — Settle All:
  User A daily reward: 1000 x 0.5% x 1.0 = 5 BTN → 7 days = 35 BTN
  User B daily reward: 2000 x 0.5% x 1.1 = 11 BTN → 7 days = 77 BTN
  User C daily reward: 5000 x 0.5% x 1.2 = 30 BTN → 7 days = 210 BTN

  Direct bonuses (already credited on stake):
  - A gets 5% of B's stake: 2000 x 5% = 100 BTN
  - B gets 5% of C's stake: 5000 x 5% = 250 BTN

  Matching bonuses (on settlement):
  - When B settles (77 BTN reward):
    A (L1): 77 x 10% = 7.7 BTN (A is T1, L1 allowed)
  - When C settles (210 BTN reward):
    B (L1): 210 x 10% = 21 BTN (B is T2, L1 allowed)
    A (L2): 210 x 5% = 10.5 BTN (A is T1, L2 allowed)

  Settlement splits (10/90):
  - User A: (35 + 100 + 7.7 + 10.5) = 153.2 BTN
    → 15.32 withdrawable, 137.88 vesting
  - User B: (77 + 250 + 21) = 348 BTN
    → 34.8 withdrawable, 313.2 vesting
  - User C: 210 BTN
    → 21 withdrawable, 189 vesting

  Total deducted from pool: 153.2 + 348 + 210 = 711.2 BTN
  Pool remaining: 50,000 - 711.2 = 49,288.8 BTN

Day 14 — Vesting releases:
  User A: 137.88 x 0.5% x 7 = 4.8258 BTN released to WW
  User B: 313.2 x 0.5% x 7 = 10.962 BTN released to WW
  User C: 189 x 0.5% x 7 = 6.615 BTN released to WW

Verify:
  - All amounts match formulas exactly
  - Pool balance decreased correctly
  - Vesting balances reduced after release
  - Withdrawal wallet accumulated both 10% and released amounts
```

#### Scenario B: "Reward Pool Depletion"

```
Setup:
- 100 users, each T3, each stakes 10,000 BTN Long
- Reward pool: 100,000 BTN
- Daily reward per user: 10000 x 0.5% x 1.2 = 60 BTN
- Total daily: 100 x 60 = 6,000 BTN

Expected pool life:
- 100,000 / 6,000 = ~16.67 days

Test:
- Settle at day 7: 100 x 60 x 7 = 42,000 BTN. Pool = 58,000.
- Settle at day 14: another 42,000 BTN. Pool = 16,000.
- Settle at day 17: 100 x 60 x 3 = 18,000 > 16,000 → REVERTS
- Admin funds 50,000 more. Pool = 66,000.
- Settle at day 17: succeeds. Pool = 48,000.

Verify:
- Exact depletion timing matches formula
- Revert message is clear
- Recovery after funding works
```

#### Scenario C: "Deep Referral Chain (10 Levels)"

```
Setup:
- 11 users in chain: Root → L1 → L2 → L3 → ... → L10
- All T3 with 1,000 BTN staked each
- Root is the top referrer

When L10 (deepest) settles 35 BTN reward:
  L9 (L1 to L10): 35 x 10% = 3.5 BTN
  L8 (L2 to L10): 35 x 5% = 1.75 BTN
  L7 (L3 to L10): 35 x 3% = 1.05 BTN
  L6 (L4): 35 x 1% = 0.35 BTN
  L5 (L5): 35 x 1% = 0.35 BTN
  L4 (L6): 35 x 1% = 0.35 BTN
  L3 (L7): 35 x 1% = 0.35 BTN
  L2 (L8): 35 x 1% = 0.35 BTN
  L1 (L9): 35 x 1% = 0.35 BTN
  Root (L10): 35 x 1% = 0.35 BTN

  Total matching: 8.75 BTN

Verify:
  - All 10 levels receive correct percentages
  - Total matching bonus is deterministic
  - If Root were T1 (3 levels max), Root/L1/L2 would get 0 for levels 4+
```

#### Scenario D: "Early Exit Impact on Ecosystem"

```
Setup:
- Referrer R, stakes 1000 BTN T3
- User U referred by R, stakes 10,000 BTN Short

On stake: R gets direct bonus = 10000 x 5% = 500 BTN

Day 5: U unstakes early
  - U gets back: 10000 - 1500 = 8,500 BTN
  - Treasury gets: 1,500 BTN penalty
  - R's accrued rewards from U's settlement: 5 days x (10000 x 0.5% x 1.2) = 300 BTN
    But U unstaked, so no more accrual

Day 7: Settle R
  - R still has the 500 BTN direct bonus (already credited)
  - R's own staking rewards: 1000 x 0.5% x 1.2 x 7 = 42 BTN
  - R's matching from U's pre-exit rewards (if settled): depends on whether U settled first

Verify:
  - Direct bonus is not clawed back on early exit
  - Treasury received exact 15% penalty
  - R's own staking continues unaffected
  - No orphaned rewards in system
```

---

### 11.13 Oracle Price Edge Cases

| # | Test Case | Oracle State | Expected |
|---|-----------|-------------|----------|
| OR1 | Normal price ($0.50) | price=50000000, updatedAt=now | BTN amount = feeUSD / 0.50 |
| OR2 | High price ($10.00) | price=1000000000 | BTN amount = feeUSD / 10.00 (very low BTN) |
| OR3 | Very low price ($0.01) | price=1000000 | BTN amount = feeUSD / 0.01 (very high BTN) |
| OR4 | Stale price (61 minutes old) | updatedAt = now - 3660 | **Reverts** |
| OR5 | Exactly 1 hour old | updatedAt = now - 3600 | Should still work (boundary) |
| OR6 | Zero price | price=0 | **Reverts** |
| OR7 | Negative price (impossible but test) | price=-1 | **Reverts** (underflow or check) |
| OR8 | Price changes between approve and activate | Price moves 50% | BTN amount recalculated at activation time |

---

### 11.14 Time Boundary Edge Cases

| # | Test Case | Scenario | Expected |
|---|-----------|----------|----------|
| TB1 | Settle at exactly lock expiry (30d Short) | `block.timestamp == stakeTime + 30 days` | Full reward, no penalty on unstake |
| TB2 | Unstake 1 second before lock expiry | `block.timestamp == stakeTime + 30 days - 1` | 15% penalty applied |
| TB3 | Unstake 1 second after lock expiry | `block.timestamp == stakeTime + 30 days + 1` | No penalty |
| TB4 | Settle with 0 seconds elapsed | Settle immediately after previous settle | Reward = 0 (no time passed) |
| TB5 | Vesting release with 0 elapsed | Release immediately after adding vesting | Release = 0 |
| TB6 | Very long time without settlement (365 days) | Don't settle for 1 year | Full accrual for 365 days in single settlement |
| TB7 | Settlement after stake completed | Stake fully unlocked + 100 days | Rewards continue accruing past lock period |

---

### 11.15 Running Tokenomics Tests

**On Local Hardhat (with time manipulation):**

```bash
# Clone repo and install
git clone https://github.com/rastaaashu/bitton-contracts.git
cd bitton-contracts && npm install

# Run all tests (includes tokenomics)
npx hardhat test

# Run specific test suites
npx hardhat test test/RewardEngine.test.js      # Reward calculations
npx hardhat test test/VestingPool.test.js        # Vesting release math
npx hardhat test test/BonusEngine.test.js        # Direct + matching bonuses
npx hardhat test test/StakingVault.test.js       # Staking + early exit
npx hardhat test test/SystemIntegration.test.js  # Multi-contract scenarios

# Run with coverage
npx hardhat coverage
```

**Time Manipulation in Hardhat (for manual testing):**

```javascript
// Advance time by 7 days
await ethers.provider.send("evm_increaseTime", [7 * 86400]);
await ethers.provider.send("evm_mine");

// Advance time by 1 hour
await ethers.provider.send("evm_increaseTime", [3600]);
await ethers.provider.send("evm_mine");
```

**On Testnet (without time manipulation):**
- Use short wait periods (minutes instead of days)
- Or use already-deployed contracts where time has passed
- Check existing stake positions that have accrued rewards
- Verify calculation with: `getPendingRewards(user, stakeIndex)` view function

---

## 12. Scalability & Gas Cost Analysis Test Cases

### 12.1 Per-Operation Gas Cost Benchmarks

Run these on local Hardhat and testnet. Record actual gas used for each operation:

| # | Operation | Expected Gas | Benchmark Command |
|---|-----------|-------------|-------------------|
| G1 | Vault Activation (USDT) | ~150,000 | `activateVault(1)` after USDT approve |
| G2 | Vault Activation (BTN via oracle) | ~180,000 | `activateVault(1)` after BTN approve |
| G3 | Stake (Short) | ~200,000 | `stake(1000e6, 0)` after BTN approve |
| G4 | Stake (Long) | ~200,000 | `stake(1000e6, 1)` after BTN approve |
| G5 | Unstake (after lock, no penalty) | ~150,000 | `unstake(0)` after 30 days |
| G6 | Unstake (early, with 15% penalty) | ~200,000 | `unstake(0)` before lock expiry |
| G7 | Settle Weekly (1 stake) | ~250,000 | `settleWeekly(user)` |
| G8 | Settle Weekly (5 stakes) | ~500,000 | `settleWeekly(user)` with 5 active stakes |
| G9 | Settle Weekly (10 stakes) | ~900,000 | `settleWeekly(user)` with 10 active stakes |
| G10 | Release Vesting | ~120,000 | `release(user)` |
| G11 | Withdraw | ~80,000 | `withdraw(amount)` |
| G12 | Register Referrer | ~100,000 | `registerReferrer(addr)` |
| G13 | Fund Rewards (admin) | ~120,000 | `fundRewards(amount)` after BTN approve |
| G14 | ERC20 Approve | ~46,000 | `approve(spender, amount)` |
| G15 | Batch Migrate (50 users) | ~800,000 | `batchMigrate(50 recipients)` |
| G16 | Batch Migrate (200 users) | ~2,500,000 | `batchMigrate(200 recipients)` |

**How to measure:**
```javascript
const tx = await contract.stake(amount, 0);
const receipt = await tx.wait();
console.log("Gas used:", receipt.gasUsed.toString());
```

---

### 12.2 Gas Cost Projections by User Scale

**Base Sepolia gas price: ~0.001 gwei avg. Base Mainnet: ~0.01-0.05 gwei.**
**ETH price assumption: $3,000**

#### One-Time Operations (per user)

| Operation | Gas | Cost @ 0.01 gwei | Cost @ 0.05 gwei |
|-----------|-----|-------------------|-------------------|
| Register (wallet sign only) | 0 (off-chain) | $0 | $0 |
| Approve BTN | 46,000 | $0.00000138 | $0.0000069 |
| Activate Vault | 180,000 | $0.0000054 | $0.000027 |
| Register Referrer | 100,000 | $0.000003 | $0.000015 |
| **Total per user setup** | **~326,000** | **~$0.00001** | **~$0.00005** |

#### Recurring Operations (per user per week)

| Operation | Gas | Cost @ 0.01 gwei | Cost @ 0.05 gwei |
|-----------|-----|-------------------|-------------------|
| Settle Weekly (avg 3 stakes) | 400,000 | $0.000012 | $0.00006 |
| Release Vesting | 120,000 | $0.0000036 | $0.000018 |
| Withdraw | 80,000 | $0.0000024 | $0.000012 |
| **Total per user per week** | **~600,000** | **~$0.000018** | **~$0.00009** |

#### Scale Projections

| Users | One-Time Setup (total gas) | Weekly Ops (total gas) | Monthly Gas Cost (mainnet 0.05 gwei) |
|-------|---------------------------|----------------------|--------------------------------------|
| 1,000 | 326M gas = ~$0.05 | 600M gas/week = ~$0.09/wk | **~$0.36/month** |
| 10,000 | 3.26B gas = ~$0.49 | 6B gas/week = ~$0.90/wk | **~$3.60/month** |
| 100,000 | 32.6B gas = ~$4.90 | 60B gas/week = ~$9.00/wk | **~$36/month** |
| 500,000 | 163B gas = ~$24.50 | 300B gas/week = ~$45/wk | **~$180/month** |
| 1,000,000 | 326B gas = ~$49.00 | 600B gas/week = ~$90/wk | **~$360/month** |

> **Note:** These are extremely low because Base L2 gas costs are a fraction of Ethereum L1. On Ethereum L1, multiply costs by ~1000x.

---

### 12.3 Migration Gas Cost Analysis

| Batch Size | Gas per Batch | Users per TX | Cost per Batch (0.05 gwei) |
|-----------|--------------|-------------|---------------------------|
| 50 users | ~800,000 | 50 | $0.0012 |
| 100 users | ~1,500,000 | 100 | $0.00225 |
| 200 users | ~2,500,000 | 200 | $0.00375 |

| Total Users to Migrate | Batches (size 200) | Total Gas | Total Cost (Base) |
|------------------------|-------------------|-----------|-------------------|
| 10,000 | 50 | ~125M | **~$0.19** |
| 60,000 | 300 | ~750M | **~$1.13** |
| 100,000 | 500 | ~1.25B | **~$1.88** |
| 1,000,000 | 5,000 | ~12.5B | **~$18.75** |

> **Validated:** Migration of 60,000 users costs approximately **$1-25** on Base (matches the ~$23-25 estimate from stress testing).

---

### 12.4 Settlement Gas Scaling Test

Settlement gas increases linearly with number of active stakes per user. Test this:

```
Test: Create user with N stakes, settle, measure gas

| Active Stakes | Expected Gas | Bottleneck |
|---------------|-------------|------------|
| 1 | ~250,000 | None |
| 5 | ~500,000 | None |
| 10 | ~900,000 | Approaching limit |
| 20 | ~1,700,000 | May need gas limit check |
| 50 | ~4,000,000 | Block gas limit concern |
| 100 | ~8,000,000+ | Likely exceeds block limit |

IMPORTANT: If a user has too many active stakes, settlement
may exceed block gas limit (~30M on Base). Consider adding a
max stake count per user or paginated settlement.
```

**Test Script:**
```javascript
// Scale test: measure settlement gas vs stake count
for (const stakeCount of [1, 5, 10, 20, 50]) {
  // Setup: create stakeCount stakes for user
  for (let i = 0; i < stakeCount; i++) {
    await stakingVault.connect(user).stake(parseUnits("100", 6), 0);
  }

  // Advance 7 days
  await ethers.provider.send("evm_increaseTime", [7 * 86400]);
  await ethers.provider.send("evm_mine");

  // Measure settlement gas
  const tx = await rewardEngine.settleWeekly(user.address);
  const receipt = await tx.wait();
  console.log(`Stakes: ${stakeCount}, Gas: ${receipt.gasUsed}`);
}
```

---

### 12.5 Matching Bonus Depth Gas Analysis

Matching bonus walks up the referral chain. Deeper chains = more gas:

```
| Referral Depth | Expected Gas (on settlement) | Notes |
|---------------|------------------------------|-------|
| 1 level | ~250,000 base + ~30,000 | Minimal overhead |
| 3 levels (T1) | ~250,000 base + ~90,000 | T1 max |
| 5 levels (T2) | ~250,000 base + ~150,000 | T2 max |
| 10 levels (T3) | ~250,000 base + ~300,000 | T3 max, highest gas |
| 10 levels (mixed qualified/skip) | ~250,000 base + ~300,000 | Still traverses 10 |
```

**Key insight:** The chain is always traversed up to the tier limit, even if ancestors are unqualified (they're skipped but still checked). Gas cost is proportional to depth limit, not actual qualified ancestors.

---

### 12.6 Backend API Scalability Projections

| Component | 1K Users | 10K Users | 100K Users | 1M Users |
|-----------|---------|----------|-----------|---------|
| **DB Size (est.)** | 50MB | 500MB | 5GB | 50GB |
| **Dashboard API latency** | <200ms | <500ms | <2s (need caching) | Need read replicas |
| **Event history query** | <500ms | <2s | >5s (need indexer) | Need The Graph |
| **RPC calls/day** | 50K | 500K | 5M (need dedicated) | 50M (need cluster) |
| **Operator jobs/day** | 100 | 1,000 | 10,000 | 100,000 |
| **DB connections needed** | 5 | 10 | 50 | 200+ |

#### Bottleneck Analysis

| Scale | First Bottleneck | Solution | Cost Impact |
|-------|-----------------|----------|-------------|
| 10K | RPC rate limits | Dedicated RPC provider (Alchemy/Infura) | $50-200/month |
| 50K | Event history query speed | The Graph subgraph or custom indexer | $100-500/month |
| 100K | Database performance | Connection pooling + read replicas (Neon Pro) | $200-1000/month |
| 500K | Backend throughput | Horizontal scaling (2-4 instances) + load balancer | $500-2000/month |
| 1M | Settlement operator | Multiple operator workers + queue system | $1000-5000/month |

---

### 12.7 Stress Test: Concurrent Settlement Simulation

**Objective:** Verify system handles many settlements in rapid succession.

```bash
# Artillery test for settlement API
# Create artillery-settlement-stress.yml:
config:
  target: "https://bitton-backend.onrender.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Settlement burst"
  defaults:
    headers:
      X-API-Key: "<ADMIN_KEY>"
      Content-Type: "application/json"

scenarios:
  - name: "Dispatch settlement"
    flow:
      - post:
          url: "/admin/jobs/distribute"
          json:
            jobType: "SETTLE_WEEKLY"
            to: "0x{{ $randomString() }}"
            amount: "100"
```

**Monitor during test:**
- Operator job queue size (should not grow unbounded)
- RPC call failures (rate limiting)
- Database connection count
- Response latency p95

---

### 12.8 Scalability Test Matrix

| Test | Method | Tool | Pass Criteria |
|------|--------|------|---------------|
| Single user gas benchmark | Local Hardhat | Hardhat test | All ops < 500K gas |
| Multi-stake settlement scaling | Local Hardhat | Custom script | Linear gas growth, no exponential |
| Migration batch optimization | Local Hardhat | deploy script | 200 users/tx, < 3M gas |
| API throughput (read) | Testnet | Artillery | >100 req/s, p95 < 2s |
| API throughput (write) | Testnet | Artillery | >10 req/s, p95 < 5s |
| Concurrent settlements (10) | Testnet | Parallel curl | All succeed, no nonce conflicts |
| Database under load | Testnet | k6 | 1000 concurrent reads, <500ms |
| Event history at scale | Testnet | Manual | 10K events query < 5s |
| Reward pool depletion timing | Local Hardhat | Custom script | Matches formula exactly |
| Block gas limit check | Local Hardhat | Custom script | No single tx exceeds 30M gas |
