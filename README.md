# 💳 Transaction Ledger & Balance Management System

A full-stack financial transaction system built with Node.js, PostgreSQL, and React. Handles atomic money transfers, double-entry bookkeeping, idempotency, and automated reconciliation — the core concepts behind real fintech infrastructure.

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| **Frontend** | https://transactional-lader-system.vercel.app |
| **Backend API** | https://strong-essence-production-0575.up.railway.app |
| **Health Check** | https://strong-essence-production-0575.up.railway.app/health |

---

## 📸 Screenshots

> Register → Dashboard → Transfer → Ledger History

<img width="761" height="680" alt="image" src="https://github.com/user-attachments/assets/b7c79728-19c8-4aec-9273-a69099ab2e25" />
<br>
<img width="1280" height="837" alt="image" src="https://github.com/user-attachments/assets/43763b1f-ad56-40a8-9549-40ee44acd9d3" />
<br>
<img width="1280" height="577" alt="image" src="https://github.com/user-attachments/assets/4221fe79-9815-42bf-a70a-da59a503c3db" />
<br>
<img width="1280" height="838" alt="image" src="https://github.com/user-attachments/assets/26892918-9078-49b1-b2df-de1ed5b2fc2f" />


---

## 🎯 The Problem It Solves

In any system that moves money, three things must be guaranteed:

**You cannot lose money**
If a transfer deducts from the sender but crashes before crediting the receiver, money disappears. Solved with database transactions — all balance updates are atomic or none happen.

**You cannot duplicate money**
If a user clicks Send twice or the network retries a request, the same transfer cannot process twice. Solved with idempotency keys stored as a UNIQUE constraint in PostgreSQL.

**You cannot corrupt balances**
If two transfers hit the same account at the same millisecond, both might read the same balance and overdraft. Solved with SELECT FOR UPDATE — rows are locked before reading so concurrent transfers queue safely.

---

## ✨ Features

### Phase 1 — Core System
- JWT authentication (register, login, protected routes)
- Auto-create default account on registration
- Deposit money into accounts
- Atomic money transfers using `db.transaction()`
- Paginated transaction history
- Consistent error responses with machine-readable error codes
- Input validation with Zod on every endpoint
- Global error handler mapping error codes to HTTP status codes

### Phase 2 — Production Grade
- **SELECT FOR UPDATE** with deadlock-safe row ordering (ORDER BY id)
- **Idempotency keys** in PostgreSQL — duplicate requests replay original response
- **Double-entry ledger** — every transfer creates DEBIT + CREDIT entries with `balance_after` snapshots
- **Reconciliation engine** — 3 SQL integrity checks verify no money was created or destroyed
- **Helmet** — 11 HTTP security headers in one line
- **Rate limiting** — 20 auth requests / 100 general requests per 15 minutes per IP
- **Load tested** — 20 concurrent transfers verified correct under concurrency

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server and REST API |
| PostgreSQL | ACID-compliant database for financial data |
| Knex.js | SQL query builder + migration management |
| bcryptjs | Password hashing with 10 salt rounds |
| jsonwebtoken | JWT signing and verification |
| Zod | Runtime request body schema validation |
| Helmet | 11 HTTP security headers |
| express-rate-limit | Brute force and DDoS protection |

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | Component-based UI with fast dev server |
| React Router | Client-side page navigation |
| Tailwind CSS | Utility-first styling |
| Context API | Global auth state management |

### Deployment
| Service | What runs there |
|---|---|
| Railway | Node.js backend + managed PostgreSQL |
| Vercel | React frontend (static build) |

---

## 🗄 Database Schema

```
users
├── id             UUID primary key
├── email          VARCHAR unique
├── password_hash  VARCHAR
├── role           ENUM (USER, ADMIN)
└── created_at     TIMESTAMP

accounts
├── id             UUID primary key
├── user_id        UUID → users.id
├── name           VARCHAR
├── balance        NUMERIC(20, 8)   ← exact decimal, never FLOAT
├── currency       VARCHAR default INR
├── status         ENUM (ACTIVE, SUSPENDED, CLOSED)
└── created_at     TIMESTAMP

transactions
├── id               UUID primary key
├── idempotency_key  VARCHAR unique   ← prevents duplicate charges
├── from_account_id  UUID nullable    ← null for deposits
├── to_account_id    UUID
├── amount           NUMERIC(20, 8)
├── type             ENUM (TRANSFER, DEPOSIT, WITHDRAWAL)
├── status           ENUM (PENDING, COMPLETED, FAILED)
├── note             VARCHAR nullable
└── created_at       TIMESTAMP

ledger_entries
├── id               UUID primary key
├── transaction_id   UUID → transactions.id
├── account_id       UUID → accounts.id
├── entry_type       ENUM (DEBIT, CREDIT)
├── amount           NUMERIC(20, 8)
├── balance_after    NUMERIC(20, 8)   ← balance snapshot at time of entry
└── created_at       TIMESTAMP
```

---

## 📡 API Reference

All protected endpoints require:
```
Authorization: Bearer <your_jwt_token>
```

All error responses follow this shape:
```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "You do not have enough balance for this transfer"
  }
}
```

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Register user + auto-create account |
| POST | `/api/v1/auth/login` | No | Login and receive JWT token |

### Account Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/accounts` | Yes | Get all accounts for logged in user |
| GET | `/api/v1/accounts/:id` | Yes | Get single account by ID |
| POST | `/api/v1/accounts` | Yes | Create a new account |

### Transaction Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/transactions/transfer` | Yes | Transfer between accounts (idempotent) |
| POST | `/api/v1/transactions/deposit` | Yes | Deposit into account (idempotent) |
| GET | `/api/v1/transactions` | Yes | Paginated transaction history |
| GET | `/api/v1/transactions/accounts/:id/history` | Yes | Ledger entries with balance snapshots |

### Reconciliation Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/reconciliation/run` | Yes | Run 3 integrity checks, return report |

### Example: Transfer Request

```bash
POST /api/v1/transactions/transfer
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "fromAccountId": "660e8400-e29b-41d4-a716-446655440001",
  "toAccountId":   "770e8400-e29b-41d4-a716-446655440002",
  "amount": "500.00",
  "note": "Splitting rent"
}
```

**Success Response — 201:**
```json
{
  "data": {
    "transaction": {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "from_account_id": "660e8400-e29b-41d4-a716-446655440001",
      "to_account_id":   "770e8400-e29b-41d4-a716-446655440002",
      "amount": "500.00000000",
      "type": "TRANSFER",
      "status": "COMPLETED",
      "note": "Splitting rent"
    },
    "newBalance": "500.00000000",
    "replayed": false
  }
}
```

**Error Response — 402:**
```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "You do not have enough balance for this transfer"
  }
}
```

---

## 🔑 Key Technical Decisions

### Why NUMERIC(20,8) and not FLOAT?

IEEE 754 floating point cannot represent 0.1 exactly in binary.
`0.1 + 0.2` in JavaScript gives `0.30000000004`.
Over thousands of transactions this error compounds into real money loss.
`NUMERIC(20,8)` stores exact decimal values — this is what every real bank uses.

### Why SELECT FOR UPDATE?

Without locking, two concurrent transfers can both read the same balance simultaneously and both think there is enough money — causing an overdraft.

```sql
SELECT * FROM accounts
WHERE id IN (?, ?)
ORDER BY id        -- always lock in same order to prevent deadlock
FOR UPDATE         -- lock rows until transaction commits
```

`ORDER BY id` is critical. If Transfer A locks account 1 then waits for account 2, while Transfer B locks account 2 then waits for account 1, both wait forever — a deadlock. Sorting by ID means both transfers always try to lock the lower UUID first, so one waits safely behind the other.

### Why idempotency keys in PostgreSQL (not Redis)?

A user's network can drop after the server processes a transfer but before the client receives the response. The client retries — without idempotency, money is sent twice.

We store a client-generated UUID as a `UNIQUE` column on transactions. On retry, we find the existing transaction and return it immediately. The `UNIQUE` constraint in PostgreSQL is the final safety net — even if application code has a bug, the database rejects duplicates.

No Redis needed. Pure PostgreSQL. Simple and reliable.

### Why double-entry bookkeeping?

Every transfer creates two ledger entries:
- **DEBIT** for the sender — money left their account
- **CREDIT** for the receiver — money arrived in their account

The `balance_after` column stores a snapshot of the exact balance at that moment in time. This makes reconciliation possible and provides a complete, immutable audit trail. This is how every real bank records transactions.

---

## 🔍 Reconciliation

The reconciliation service runs 3 SQL integrity checks:

**Check 1 — Balance vs ledger sum**
For every account, sum all CREDIT entries and subtract all DEBIT entries.
Compare to the stored `balance` column.
Any difference greater than 0.000001 means money appeared or disappeared without a record.

**Check 2 — Debits equal credits per transaction**
For every TRANSFER transaction, total debits must equal total credits.
If not, the double-entry bookkeeping is broken.

**Check 3 — Stuck PENDING transactions**
Any transaction stuck in PENDING status older than 5 minutes means a transfer started but never completed — usually from a server crash mid-transfer.

A healthy system returns zero results from all three checks.

---

## ⚡ Load Test Results

20 concurrent transfers fired simultaneously from one account.
`SELECT FOR UPDATE` ensures all transfers are serialized correctly.
Zero money created or destroyed.

```
Testing SELECT FOR UPDATE concurrency safety

Registered anish. Account ID: a6a07c7b-dfa1-4867-9717-cdf176762061
Registered rahul. Account ID: f64b4d59-e02f-4cc1-8425-ae97f2d05ac6
Deposited 10000 into anish account

Firing 20 concurrent transfers of 100 rupees each...

=== RESULTS ===
Duration:           70633ms
Successful:         20 / 20
Failed:             0 / 20

=== BALANCE VERIFICATION ===
Anish final balance:  8000
Rahul final balance:  2000
Total money in system: 10000

=== ASSERTIONS ===
PASS - Total money conserved: 10000 === 10000
PASS - Anish balance correct: 8000
PASS - Rahul balance correct: 2000
PASS - No negative balances

=== RECONCILIATION CHECK ===
PASS - Reconciliation passed. Ledger is balanced.

=== LOAD TEST COMPLETE ===
```

---

## 🚀 Local Setup

**Prerequisites:** Node.js 18+, PostgreSQL running locally

### Backend

**1. Clone the repo**
```bash
git clone https://github.com/Anish033-coder/Transactional-Lader-System.git
cd Transactional-Lader-System/backend
```

**2. Install dependencies**
```bash
npm install
```

**3. Create environment file**
```bash
cp .env.example .env
```

Open `.env` and fill in:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/ledger_db
PORT=3001
JWT_SECRET=any-long-random-string-here
NODE_ENV=development
```

**4. Create the database**
```bash
psql -U postgres -c "CREATE DATABASE ledger_db;"
```

**5. Run migrations**
```bash
npm run migrate
```

**6. Start the server**
```bash
npm run dev
```

Server runs at `http://localhost:3001`
Health check: `http://localhost:3001/health`

**7. Run the load test**
```bash
node loadtest.js
```

### Frontend

**1. Go to frontend folder**
```bash
cd ../frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Create environment file**
```bash
echo "VITE_API_URL=http://localhost:3001/api/v1" > .env
```

**4. Start the dev server**
```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📁 Project Structure

```
Transactional-Lader-System/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users.js
│   │   │   │   ├── 002_create_accounts.js
│   │   │   │   ├── 003_create_transactions.js
│   │   │   │   ├── 004_add_idempotency_key.js
│   │   │   │   └── 005_create_ledger_entries.js
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── accounts.js
│   │   │   ├── transactions.js
│   │   │   └── reconciliation.js
│   │   ├── services/
│   │   │   ├── AuthService.js
│   │   │   ├── TransactionService.js
│   │   │   └── ReconciliationService.js
│   │   └── index.js
│   ├── loadtest.js
│   ├── .env.example
│   ├── knexfile.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── lib/
    │   │   └── api.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── BalanceCard.jsx
    │   │   ├── TransferModal.jsx
    │   │   └── TransactionTable.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Transactions.jsx
    │   │   └── History.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env
    └── package.json
```

---

## 🚢 Deployment

**Backend** deployed on Railway with managed PostgreSQL.
Start command runs migrations automatically on every deploy:
```
npx knex migrate:latest && node src/index.js
```

**Frontend** deployed on Vercel with `VITE_API_URL` pointing to Railway backend.

Both platforms auto-deploy on every push to the `main` branch. Zero manual steps after setup.

---

## ⚠️ Known Limitations

These are intentional Phase 1/2 tradeoffs — not bugs:

- **JWT in localStorage** — XSS risk. Should use HTTP-only cookies in production
- **In-memory rate limiter** — resets on server restart. Should use Redis store for multi-instance
- **No unit test suite** — edge cases not covered by automated tests
- **No refresh token** — users must log in again after 7 days

---

## 📚 What I Learned Building This

- How PostgreSQL database transactions work and why atomicity matters for financial systems
- The difference between FLOAT and NUMERIC and why it is critical for money storage
- How `SELECT FOR UPDATE` prevents race conditions in concurrent database writes
- How deadlocks occur and why ordering lock acquisition by ID prevents them
- How idempotency keys prevent duplicate charges under network retry scenarios
- How double-entry bookkeeping creates a complete immutable audit trail
- How to structure a Node.js backend with clean separation of concerns
- How to deploy a backend with a managed database using Railway auto-migrations
- How to build and deploy a React frontend with Vite and Tailwind on Vercel

---

## 👤 Author

**Anish Kumawat**
IIIT Lucknow

[![GitHub](https://img.shields.io/badge/GitHub-Anish033--coder-black?style=flat&logo=github)](https://github.com/Anish033-coder)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/anish-kumawat-233177346/)

---

## 📄 License

MIT — free to use and modify.
