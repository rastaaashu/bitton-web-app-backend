# BitTON.AI -- TON to Base Migration

## Overview

Migrate user balances from the legacy TON-based system to BTN on Base L2. The process is admin-initiated, user-verified, and executed on-chain via `CustodialDistribution.batchMigrate()`.

## Pipeline

```
1. SNAPSHOT    Admin imports TON balance data
2. LINK        Users link TON wallet to EVM wallet
3. BUILD       Admin matches links with snapshots -> creates claims
4. DISPATCH    Admin batches claims into operator jobs
5. EXECUTE     Operator runner calls batchMigrate on-chain
6. VERIFY      Users check status via API
```

## Steps

### 1. Import Snapshot

`POST /admin/ton/import-snapshot` (admin API key required)

### 2. Link Wallets

`POST /migration/link-wallet` -- challenge-response with TON proof verification

### 3. Build Claims

`POST /admin/migration/build` -- matches verified wallet links with snapshot data

### 4. Dispatch Batches

`POST /admin/jobs/dispatch` -- creates BATCH_MIGRATE operator jobs in batches of 200

### 5. Execution

The operator runner picks up jobs and calls `CustodialDistribution.batchMigrate(recipients[], amounts[])`.

### 6. Status Check

`GET /migration/status/:evmAddress` -- returns migration status

## Security

- TON proof verification (Ed25519 signature)
- Challenge-response with 5-minute expiry
- One-time challenge consumption
- Double-claim prevention (DB + on-chain)
- TON <-> EVM address uniqueness enforcement
