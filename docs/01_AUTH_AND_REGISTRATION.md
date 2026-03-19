# BitTON.AI -- Auth & Registration (V2)

## Multi-Method Authentication

BitTON.AI supports three independent login methods. Wallet connection is NOT required for email or Telegram login.

| Method | Registration | Login | Wallet Required? |
|--------|-------------|-------|-----------------|
| Wallet (RainbowKit) | Connect + sign | Challenge-sign | Yes |
| Email (OTP) | Email + OTP + optional wallet | Email + OTP | No |
| Telegram | Widget auth + optional wallet | Widget auth | No |

### Registration Flows

**Wallet Registration:**
1. User arrives via referral link (`/register?ref=CODE`)
2. Connects wallet via RainbowKit
3. Signs registration message
4. Account created as CONFIRMED immediately

**Email Registration:**
1. User enters email
2. Backend sends 6-digit OTP
3. User verifies OTP
4. Optionally connects wallet
5. Account created as CONFIRMED

**Telegram Registration:**
1. User authenticates via Telegram widget
2. HMAC verified against bot token
3. Optionally connects wallet
4. Account created as CONFIRMED

### Login Flows

**Wallet Login:**
1. Connect wallet via RainbowKit
2. Backend issues challenge (nonce + timestamp)
3. User signs challenge
4. Backend verifies signature, returns JWT

**Email Login:**
1. User enters email
2. Backend sends 6-digit OTP
3. User verifies OTP
4. Backend returns JWT

**Telegram Login:**
1. User authenticates via Telegram widget
2. Backend verifies HMAC
3. Backend returns JWT

### Token Strategy

- **Access token**: JWT, 15 min expiry
- **Refresh token**: JWT, 7 day expiry, stored in LoginSession table
- **Rotation**: On `/auth/refresh`, old refresh token is revoked, new one issued
- **Frontend storage**: `localStorage` (keys: `bitton_access_token`, `bitton_refresh_token`)

### Sponsor / Referral

- Referral link: `/register?ref=CODE_OR_WALLET_ADDRESS`
- Accepts both sponsor code strings and EVM wallet addresses
- Auto-creates a sponsor code for every new user on registration
- Sponsor relationship stored as `User.sponsorId`

## Route Protection (Frontend)

- **Public pages** (no sidebar/header): `/login`, `/register`
- **Protected pages** (sidebar+header, requires JWT): everything else
- Root `/` redirects to `/dashboard` if authed, `/login` if not

## Security

- **Passwords**: bcrypt with 12 salt rounds
- **Wallet auth**: ECDSA signature verification via ethers.js
- **Telegram auth**: HMAC-SHA256 against bot token
- **JWT**: HS256, access token 15min, refresh token 7d
- **OTP**: Crypto-safe generation, 10-min expiry, max 5 attempts
- **Rate limiting**: 20 req/15min on auth, 5 req/15min on OTP
- **Validation**: Zod schemas on all inputs
- **Sessions**: Stored in DB with IP + user-agent, revocable

## Data Model

```
User
|-- id (UUID)
|-- email (unique, nullable)
|-- evmAddress (unique, nullable)
|-- telegramId (unique, nullable)
|-- status: CONFIRMED
|-- authMethod: WALLET | EMAIL | TELEGRAM
|-- sponsorId -> User
|-- SponsorCode[]
|-- LoginSession[]

PendingSession
|-- type: REGISTER_EMAIL | LOGIN_EMAIL | REGISTER_TELEGRAM | LOGIN_TELEGRAM
|-- email / telegramId
|-- verified: boolean
|-- expiresAt (30 min)
|-- OtpCode[]

OtpCode
|-- code (6-digit)
|-- attempts (max 5)
|-- expiresAt (10 min)

WalletChallenge
|-- address (unique)
|-- nonce, message
|-- expiresAt (5 min)

SponsorCode
|-- code (unique)
|-- maxUses (0 = unlimited)
|-- usedCount

LoginSession
|-- refreshToken (unique)
|-- expiresAt (7 days)
|-- revokedAt
```
