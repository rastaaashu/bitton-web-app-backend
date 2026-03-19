# BitTON.AI -- Architecture & Scalability Blueprint (V2)

**Path from 60,000 Users to 1 Billion**

> **Note:** This document reflects the V2 system with 3 staking products (Flex30/Boost180/Max360), USDC staking, and 9 contracts including ReserveFund.

---

## 1. CURRENT ARCHITECTURE (Phase 1: 0-100K Users)

```
┌──────────────────────────────────────────────────────────────────┐
│  USERS (Browser / Mobile Browser)                                 │
│                                                                    │
│  ┌─────────────────────┐        ┌──────────────────────────┐     │
│  │  Frontend (Next.js)  │───────▶│  Backend API (Express)    │     │
│  │  Vercel CDN          │◀───────│  Render.com               │     │
│  │  Static Export (SSG)  │        │  Single Instance           │     │
│  └─────────┬───────────┘        └──────────┬───────────────┘     │
│            │                               │                      │
│            │ wagmi/viem                     │ ethers.js             │
│            │ (user signs txs)              │ (relayer sends txs)   │
│            │                               │                      │
│  ┌─────────▼───────────────────────────────▼───────────────────┐ │
│  │                BASE BLOCKCHAIN (L2)                           │ │
│  │  9 Smart Contracts (7 UUPS Upgradeable + 2 tokens)           │ │
│  │  Transactions: $0.001-0.01 each                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────┐                                  │
│  │  PostgreSQL (Neon Serverless)│                                  │
│  │  11 tables, indexed          │                                  │
│  └─────────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Bottlenecks at this scale:** None. Free tier handles demos and early users.

---

## 2. GROWTH ARCHITECTURE (Phase 2: 100K-1M Users)

```
┌──────────────────────────────────────────────────────────────────┐
│  USERS                                                            │
│                                                                    │
│  ┌─────────────────────┐        ┌──────────────────────────┐     │
│  │  Frontend (Next.js)  │───────▶│  Backend (Express.js)     │     │
│  │  Vercel Pro + CDN    │◀───────│  2-4 Instances (LB)       │     │
│  │  Edge Functions      │        │  Render/Railway            │     │
│  └─────────┬───────────┘        └──────────┬───────────────┘     │
│            │                               │                      │
│            │                    ┌──────────▼───────────────┐     │
│            │                    │  Redis Cache (Upstash)    │     │
│            │                    │  - Block timestamps       │     │
│            │                    │  - User balances (60s)    │     │
│            │                    │  - Contract state (30s)   │     │
│            │                    └──────────────────────────┘     │
│            │                               │                      │
│  ┌─────────▼───────────────────────────────▼───────────────────┐ │
│  │  BASE L2 via Alchemy RPC (Growth Plan)                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐   │
│  │  PostgreSQL (Neon Pro)       │  │  The Graph (Subgraph)     │   │
│  │  10GB, Connection Pooling    │  │  Event Indexing            │   │
│  │  Read Replica                │  │  History Queries           │   │
│  └─────────────────────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Add Redis cache (eliminates repeated RPC calls)
- Add read replica for DB (separates read/write load)
- Deploy The Graph subgraph (eliminates N+1 event queries)
- Scale backend to 2-4 instances behind load balancer
- **Cost: ~$500/month**

---

## 3. SCALE ARCHITECTURE (Phase 3: 1M-100M Users)

```
┌──────────────────────────────────────────────────────────────────┐
│  USERS (Global)                                                   │
│                                                                    │
│  ┌─────────────────────┐        ┌──────────────────────────┐     │
│  │  Frontend            │───────▶│  API Gateway (Kong/AWS)   │     │
│  │  CloudFront CDN      │◀───────│  Rate Limiting, Auth      │     │
│  │  Multi-Region Edge   │        │  Request Routing           │     │
│  └─────────────────────┘        └──────────┬───────────────┘     │
│                                             │                      │
│                              ┌──────────────┼──────────────┐      │
│                              │              │              │      │
│                    ┌─────────▼──┐  ┌───────▼────┐  ┌─────▼────┐ │
│                    │ Auth Svc    │  │ Staking Svc │  │ Admin Svc│ │
│                    │ (4 pods)    │  │ (8 pods)    │  │ (2 pods) │ │
│                    └─────────┬──┘  └───────┬────┘  └─────┬────┘ │
│                              │              │              │      │
│                    ┌─────────▼──────────────▼──────────────▼────┐ │
│                    │           Message Queue (SQS/Kafka)         │ │
│                    │  Job Processing, Event Streaming             │ │
│                    └─────────────────┬──────────────────────────┘ │
│                                      │                            │
│             ┌────────────────────────┼────────────────────┐      │
│             │                        │                    │      │
│  ┌──────────▼──────┐  ┌─────────────▼────┐  ┌───────────▼──┐  │
│  │  Redis Cluster   │  │  PostgreSQL RDS   │  │  Subgraph    │  │
│  │  (ElastiCache)   │  │  Multi-AZ         │  │  (The Graph) │  │
│  │  Sessions, Cache │  │  Read Replicas    │  │  Event Index │  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  BASE L2 (Dedicated Alchemy Nodes + Fallback Providers)      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Microservices architecture (Auth, Staking, Admin separate)
- API Gateway with rate limiting and auth
- Message queue for async job processing
- Multi-AZ PostgreSQL with read replicas
- Redis cluster for distributed caching
- Dedicated RPC nodes
- **Cost: ~$10,000/month**

---

## 4. GLOBAL ARCHITECTURE (Phase 4: 100M-1B Users)

```
┌────────────────────────────────────────────────────────────────────┐
│  1 BILLION USERS (Every Continent)                                  │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ US-East   │ │ US-West   │ │ EU-West   │ │ AP-South  │ │ AP-East  ││
│  │ CDN Edge  │ │ CDN Edge  │ │ CDN Edge  │ │ CDN Edge  │ │ CDN Edge ││
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘│
│        │             │             │             │             │     │
│  ┌─────▼─────────────▼─────────────▼─────────────▼─────────────▼──┐│
│  │              Global Load Balancer (Anycast DNS)                  ││
│  └─────────────────────────────┬──────────────────────────────────┘│
│                                 │                                    │
│  ┌──────────┐  ┌──────────┐  ┌─▼────────┐  ┌──────────┐          │
│  │ Region 1  │  │ Region 2  │  │ Region 3  │  │ Region 4  │          │
│  │ K8s       │  │ K8s       │  │ K8s       │  │ K8s       │          │
│  │ Cluster   │  │ Cluster   │  │ Cluster   │  │ Cluster   │          │
│  │ 50+ pods  │  │ 50+ pods  │  │ 50+ pods  │  │ 50+ pods  │          │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘          │
│        │             │             │             │                  │
│  ┌─────▼─────────────▼─────────────▼─────────────▼──────────────┐ │
│  │          CockroachDB / Google Spanner (Global)                 │ │
│  │          Distributed SQL, Multi-Region Replication             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  BASE L2 + L3 (App-Specific Chain if needed)                  │   │
│  │  Custom sequencer, batch settlement to Ethereum                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Multi-region Kubernetes clusters
- Global database (CockroachDB/Spanner)
- Per-region caching and compute
- Custom L3 chain if Base throughput insufficient
- Full observability, on-call, SRE team
- **Cost: ~$100,000-500,000/month**

---

## 5. SMART CONTRACT SCALABILITY

Smart contracts on Base L2 are inherently scalable:

| Metric | Current | At 1M Users | At 1B Users |
|--------|---------|-------------|-------------|
| Transactions/second | ~1,000 (Base capacity) | ~1,000 | ~1,000+ (L3 if needed) |
| Gas per operation | ~200K-500K | Same | Same |
| Cost per tx | $0.001-0.01 | Same | Same |
| Contract storage | Unlimited | Unlimited | Unlimited |
| User limit | None | None | None |

**Why contracts don't need changes:**
- Mappings scale infinitely (O(1) lookup)
- No loops over all users (per-user operations only)
- Gas costs don't increase with user count
- UUPS proxy allows logic upgrades

**At extreme scale (100M+), consider:**
- Deploy an L3 app-specific chain on Base
- Batch settlement to Ethereum mainnet
- Custom sequencer for guaranteed ordering
- This is what Coinbase and other large L2s do

---

## 6. ONE-CLICK MIGRATION FLOW

### User Experience (What Users See)

```
┌─────────────────────────────────────────┐
│          BitTON.AI Web App               │
│                                          │
│   Welcome back! You have a pending       │
│   migration from TON.                    │
│                                          │
│   Your TON Balance: 1,500 BTN            │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │                                  │   │
│   │   [  Migrate to Base (1-Click) ] │   │
│   │                                  │   │
│   └──────────────────────────────────┘   │
│                                          │
│   Migration is free. Your BTN tokens     │
│   will appear in your connected wallet   │
│   within minutes.                        │
│                                          │
└─────────────────────────────────────────┘
```

### Behind the Scenes

```
User clicks "Migrate to Base"
  │
  ▼
Frontend sends POST /migration/link-wallet
  │ (tonAddress + evmAddress + signature)
  ▼
Backend creates WalletLink record
  │
  ▼
Backend matches WalletLink with TonSnapshotRow
  │
  ▼
Backend creates MigrationClaim (PENDING)
  │
  ▼
Backend auto-dispatches to OperatorJob queue
  │
  ▼
OperatorRunner picks up job
  │
  ▼
Calls CustodialDistribution.batchMigrate([user], [amount])
  │
  ▼
BTN tokens transferred to user's EVM wallet
  │
  ▼
Frontend shows: "Migration Complete! ✓"
  │
  ▼
User sees BTN balance in wallet
```

### Batch Processing for 60,000 Users

| Step | Action | Time | Cost |
|------|--------|------|------|
| 1 | Admin imports TON snapshot | 10 seconds | $0 |
| 2 | Users link wallets (self-service) | Days/weeks | $0 |
| 3 | Admin builds migration claims | 30 seconds | $0 |
| 4 | Admin dispatches batch jobs | 5 seconds | $0 |
| 5 | OperatorRunner processes 300 batches | ~30 minutes | ~$23 gas |
| **TOTAL** | | **~30 minutes** (after users link) | **~$23** |

---

## 7. DATABASE SCALING STRATEGY

### Current: Single PostgreSQL (0-100K users)
```sql
-- 11 tables, properly indexed
-- Connection pooling via Neon
-- Handles 1,000+ queries/second
```

### Growth: Read Replicas (100K-1M users)
```
Primary (Write) ──────▶ Replica 1 (Read)
                 ──────▶ Replica 2 (Read)
                 ──────▶ Replica 3 (Read)
```
- Write queries to primary
- Read queries distributed across replicas
- Connection pooling (PgBouncer)

### Scale: Horizontal Sharding (1M-100M users)
```
Shard 1 (Users A-F)  ──▶ Primary + 2 Replicas
Shard 2 (Users G-M)  ──▶ Primary + 2 Replicas
Shard 3 (Users N-S)  ──▶ Primary + 2 Replicas
Shard 4 (Users T-Z)  ──▶ Primary + 2 Replicas
```
- Shard by user ID hash
- Each shard handles ~25M users
- Independent scaling per shard

### Global: Distributed SQL (100M-1B users)
```
CockroachDB / Google Spanner
  ├── US-East (Primary for Americas)
  ├── EU-West (Primary for Europe)
  ├── AP-South (Primary for India/Middle East)
  └── AP-East (Primary for Asia/Pacific)
```
- Automatic geo-replication
- Reads from nearest region
- Writes to nearest primary
- Strong consistency across regions

---

## 8. CACHING STRATEGY

### Layer 1: In-Memory (Current)
```typescript
// SimpleCache in backend
// TTL-based, single-instance
blockCache.set(blockNumber, timestamp, 3600000); // 1 hour
```

### Layer 2: Redis (Growth)
```
Application ──▶ Redis ──▶ RPC/Database
                 │
                 ├── Block timestamps (1 hour TTL)
                 ├── User balances (60 second TTL)
                 ├── Contract state (30 second TTL)
                 ├── Session tokens (15 minute TTL)
                 └── Rate limit counters
```

### Layer 3: CDN + Edge (Scale)
```
User ──▶ CDN Edge ──▶ API Gateway ──▶ Redis ──▶ Backend ──▶ RPC
         (static)     (rate limit)    (cache)   (compute)   (chain)
```
- Static assets cached at CDN edge (99% of frontend traffic)
- API responses cached at gateway level
- Hot data cached in Redis
- Only cache misses hit backend/RPC

---

## 9. MONITORING & OBSERVABILITY

### Current: Basic Logging
- Winston logger (JSON in production)
- Health check endpoint

### Production: Full Observability Stack
```
┌──────────────────────────────────────────┐
│              Observability                │
│                                          │
│  Metrics:    Datadog / Prometheus         │
│  Logging:    DataDog Logs / CloudWatch    │
│  Tracing:    Jaeger / DataDog APM         │
│  Errors:     Sentry                       │
│  Uptime:     Better Uptime / PagerDuty    │
│  Analytics:  Mixpanel / PostHog           │
│                                          │
│  Alerts:                                  │
│  - Backend 5xx rate > 1%                  │
│  - RPC latency > 5s                       │
│  - Relayer ETH < 0.01                     │
│  - DB connections > 80%                   │
│  - Memory usage > 85%                     │
│  - Failed operator jobs                   │
│  - Contract pause events                  │
└──────────────────────────────────────────┘
```

---

## 10. SECURITY AT SCALE

| Scale | Security Measures |
|-------|-------------------|
| **0-100K** | HTTPS, JWT, rate limiting, Helmet, CORS, contract access control |
| **100K-1M** | + WAF (Cloudflare), DDoS protection, API key rotation, multisig |
| **1M-100M** | + SOC 2 compliance, penetration testing, bug bounty, KMS |
| **100M-1B** | + Dedicated security team, ISO 27001, hardware security modules, zero-trust |

---

*This document provides the architectural roadmap for scaling BitTON.AI from its current state to serving 1 billion users globally.*

