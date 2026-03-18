# BitTON.AI -- Backend API Reference (V2)

Base URL: `http://localhost:3001` (dev) | `https://bitton-backend.onrender.com` (prod)

## Auth Endpoints

### Wallet Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register/wallet` | Register via wallet signature + sponsor code |
| POST | `/auth/login/wallet/challenge` | Get challenge message for signing |
| POST | `/auth/login/wallet/verify` | Verify wallet signature, return JWT |

### Email Auth (OTP)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register/email/init` | Start email registration (sends OTP) |
| POST | `/auth/verify-otp` | Verify 6-digit OTP |
| POST | `/auth/register/email/complete` | Complete email registration |
| POST | `/auth/login/email/init` | Start email login (sends OTP) |
| POST | `/auth/login/email/complete` | Complete email login |
| POST | `/auth/resend-otp` | Resend OTP to email |

### Telegram Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register/telegram/init` | Start Telegram registration |
| POST | `/auth/register/telegram/complete` | Complete Telegram registration |
| POST | `/auth/login/telegram/init` | Start Telegram login |
| POST | `/auth/login/telegram/complete` | Complete Telegram login |
| GET | `/auth/telegram/config` | Get Telegram bot configuration |

### Session Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/profile` | JWT | Get user profile |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/logout` | None | Revoke refresh token |
| POST | `/auth/profile/link-email/init` | JWT | Link email to account |
| POST | `/auth/profile/link-email/verify` | JWT | Verify linked email |
| POST | `/auth/profile/link-telegram` | JWT | Link Telegram to account |

---

## Sponsor Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sponsor/code/create` | JWT | Create sponsor code |
| GET | `/sponsor/validate/:codeOrAddress` | None | Validate sponsor code or wallet |
| POST | `/sponsor/bootstrap` | Admin Key | Create initial admin user + code |

---

## Dashboard Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/:address` | Full user dashboard (balances, stakes, vault) |
| GET | `/api/history/:address` | Transaction history from events |
| GET | `/api/stakes/:address` | Active stakes |
| GET | `/api/bonuses/:address` | Direct + matching bonus history |
| GET | `/api/referrals/:address` | Referrer, downline, vault tier |

---

## Admin Endpoints (x-api-key required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/status` | System overview |
| GET | `/admin/users` | List users (paginated) |
| GET | `/admin/users/:id` | Get user detail |
| GET | `/admin/jobs` | List operator jobs |
| GET | `/admin/audit` | View audit log |
| POST | `/admin/ton/import-snapshot` | Import TON snapshot |
| POST | `/admin/migration/build` | Build migration claims |
| POST | `/admin/jobs/dispatch` | Dispatch migration batches |
| POST | `/admin/jobs/distribute` | Create distribute job |

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Full health check (DB, RPC, relayer) |
| GET | `/ready` | Readiness probe (DB only) |

---

## Authentication

- **JWT**: Pass `Authorization: Bearer <accessToken>` header
- **Admin**: Pass `x-api-key: <key>` header
- **Rate limits**: Auth: 20 req/15min, OTP: 5 req/15min, Global: 100 req/min
