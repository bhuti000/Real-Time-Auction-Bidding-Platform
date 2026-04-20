<div align="center">

# 🏛️ The Curated Exchange
### Real-Time Auction & Bidding Platform

*A premium, high-performance web application for extraordinary asset bidding —
featuring live updates, secure dual-token authentication, and curated auction experiences.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-5.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start — Docker](#-quick-start--docker-recommended)
- [Manual Setup](#-manual-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [WebSocket Events](#-websocket-events)
- [Authentication Design](#-authentication-design)
- [Database Schema](#-database-schema)
- [Key Features](#-key-features)
- [Design Choices](#-design-choices)

---

## 🎯 Overview

The Curated Exchange is a full-stack real-time auction platform where authenticated users can browse, bid on, and track premium lots across categories like Fine Art, Horology, Vehicles, Collectibles, and Real Estate.

The platform handles **live concurrent bidding** — multiple users bidding simultaneously on the same lot — with the server resolving conflicts atomically, broadcasting results instantly to every connected client via WebSocket.

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` (Docker) / `http://localhost:5173` (dev) |
| Backend API | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/docs` |
| API Docs (ReDoc) | `http://localhost:8000/redoc` |

**Demo credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@curated.com` | `Admin1234` |
| User | `user@curated.com` | `User1234` |

> ℹ️ Any email containing the word `admin` will receive admin privileges in development mode (`ALLOW_EMAIL_ADMIN_HINT=true`).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│   React 19 + Vite                                           │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │ AuthContext │  │SocketContext │  │  Zustand Store   │  │
│   │  JWT mgmt   │  │  Socket.IO   │  │  Auction State   │  │
│   └──────┬──────┘  └──────┬───────┘  └──────────────────┘  │
└──────────┼───────────────┼─────────────────────────────────┘
           │ HTTPS/REST    │ WSS (WebSocket)
           ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVER LAYER                          │
│                                                             │
│   FastAPI (Python 3.11+) + python-socketio                  │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  /api/auth   /api/auctions   /api/bids   /api/admin  │  │
│   └──────────────────┬───────────────────────────────────┘  │
│                      │                                      │
│   ┌──────────────────┴───────────────────────────────────┐  │
│   │              Service Layer (Business Logic)           │  │
│   │   AuthService  │  BidService  │  SchedulerService    │  │
│   └──────┬─────────┴──────┬───────┴──────────────────────┘  │
└──────────┼────────────────┼────────────────────────────────┘
           │                │
     ┌─────▼─────┐   ┌──────▼──────┐
     │  MongoDB  │   │    Redis    │
     │  Beanie   │   │ Rate Limit  │
     │    ODM    │   │   Cache     │
     └───────────┘   └─────────────┘
```

### Request → Bid → Broadcast Flow

```
User places bid
      │
      ▼
JWT Auth check ──── invalid ──→ 401 Unauthorized
      │ valid
      ▼
Redis rate limit ── exceeded ──→ 429 Too Many Requests
      │ ok
      ▼
Auction LIVE? ────── no ────────→ 400 Auction not active
      │ yes
      ▼
amount > current? ── no ────────→ 400 Bid too low
      │ yes
      ▼
Atomic MongoDB update (find_one_and_update with $lt filter)
      │ success
      ▼
Save Bid document + Write AuditLog
      │
      ▼
Socket.IO broadcast → room "auction:{id}"
      │
      ▼
All connected clients update instantly ✓
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.11+ | Runtime |
| **FastAPI** | 0.111 | Async web framework, automatic OpenAPI docs |
| **MongoDB** | 7.0 | Primary database (document store) |
| **Beanie** | 1.26 | Async MongoDB ODM with Pydantic integration |
| **Motor** | 3.4 | Async MongoDB driver under Beanie |
| **Redis** | 7.2 | Rate limiting, pub/sub (optional scaling) |
| **python-socketio** | 5.x | WebSocket server (Socket.IO protocol) |
| **python-jose** | 3.3 | JWT creation and verification |
| **passlib[bcrypt]** | 1.7 | Password hashing |
| **APScheduler** | 3.10 | Background auction state transitions |
| **pydantic-settings** | 2.x | Typed configuration from `.env` |
| **uvicorn** | 0.30 | ASGI server |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI library |
| **Vite** | 5.x | Build tool, HMR dev server |
| **Socket.IO Client** | 4.x | Real-time bidirectional communication |
| **Vanilla CSS** | — | Custom artisanal styling |
| **Tailwind CSS** | 3.x | Utility support |
| **Zustand** | 4.x | Lightweight global state (auction store) |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** | Containerisation |
| **Docker Compose** | Multi-service orchestration |

---

## 📁 Project Structure

```
RTA/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app init, CORS, socket mount, lifespan
│   │   ├── config.py            # Settings (pydantic-settings + .env)
│   │   ├── database.py          # Motor client, Beanie init
│   │   │
│   │   ├── models/              # MongoDB document schemas (Beanie)
│   │   │   ├── user.py          # User collection
│   │   │   ├── auction.py       # Auction collection (status state machine)
│   │   │   ├── bid.py           # Bid collection (immutable audit trail)
│   │   │   ├── collection.py    # Private collections
│   │   │   ├── refresh_token.py # Hashed refresh tokens
│   │   │   └── audit_log.py     # System audit events
│   │   │
│   │   ├── schemas/             # Pydantic request/response models
│   │   │   ├── user.py          # UserCreate (with password policy), TokenResponse
│   │   │   ├── auction.py       # AuctionCreate, AuctionResponse
│   │   │   └── bid.py           # BidCreate, BidResponse
│   │   │
│   │   ├── routes/              # FastAPI APIRouters
│   │   │   ├── auth.py          # /auth/register, /login, /refresh, /logout
│   │   │   ├── auctions.py      # /auctions CRUD + filter endpoints
│   │   │   ├── bids.py          # /auctions/{id}/bids
│   │   │   ├── collections.py   # /collections
│   │   │   ├── users.py         # /users/me profile + history
│   │   │   └── admin.py         # /admin panel routes
│   │   │
│   │   ├── services/            # Business logic (no logic in routes)
│   │   │   ├── auth_service.py  # Token creation, hashing, admin detection
│   │   │   ├── bid_service.py   # place_bid() — atomic + broadcast
│   │   │   ├── auction_service.py
│   │   │   └── scheduler_service.py  # SCHEDULED→LIVE→COMPLETED transitions
│   │   │
│   │   ├── core/
│   │   │   ├── security.py      # get_current_user() dependency, startup guard
│   │   │   ├── rate_limiter.py  # Redis-backed rate limiting
│   │   │   ├── permissions.py   # require_admin() dependency
│   │   │   ├── exceptions.py    # Custom exception classes
│   │   │   └── error_handlers.py # Uniform JSON error responses, 500 scrubbing
│   │   │
│   │   ├── websocket/
│   │   │   ├── socket_manager.py  # AsyncServer, broadcast(), room management
│   │   │   ├── events.py          # Event name constants
│   │   │   └── handlers.py        # connect, disconnect, join_auction handlers
│   │   │
│   │   └── utils/
│   │       ├── datetime_utils.py
│   │       ├── pagination.py
│   │       └── response.py        # success_response(), error_response()
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_bids.py
│   │   └── test_auctions.py
│   │
│   ├── seed.py                  # Sample data loader
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── .env                     # ← create from .env.example, never commit
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/           # AdminPanel, ProductForm, UserManagement
│   │   │   ├── auction/         # AuctionCard, BiddingInterface, BidHistory,
│   │   │   │                    # CountdownTimer, LiveBidFeed, ImageGallery
│   │   │   ├── collections/     # CollectionCard, FeaturedCollectionCard
│   │   │   ├── common/          # Button, Footer, Input, Modal, Navbar
│   │   │   ├── dashboard/       # DashboardHeader, Sidebar, WonItems
│   │   │   └── upcoming/        # UpcomingAuctionCard
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # JWT state, login/logout
│   │   │   └── SocketContext.jsx # Socket.IO instance, room management
│   │   │
│   │   ├── hooks/
│   │   │   └── useCountdown.js  # Server-synced countdown timer
│   │   │
│   │   ├── pages/
│   │   │   ├── home.jsx          # Landing page
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AuctionDetail.jsx # Live bidding view
│   │   │   ├── LiveAuctions.jsx
│   │   │   ├── UpcomingAuctions.jsx
│   │   │   ├── PrivateCollections.jsx
│   │   │   ├── Artists.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Admin.jsx
│   │   │
│   │   ├── store/
│   │   │   └── useAuctionStore.js  # Zustand store
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🐳 Quick Start — Docker (Recommended)

The fastest way to run the full stack: frontend, backend, MongoDB, and Redis together.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/curated-exchange.git
cd curated-exchange

# 2. Build and start all services
docker-compose up --build

# 3. (Optional) Load sample auction data
docker-compose exec backend python seed.py
```

**Services started:**

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3000 | React app served via Nginx |
| Backend API | http://localhost:8000 | FastAPI + Socket.IO |
| API Docs | http://localhost:8000/docs | Swagger UI |
| MongoDB | localhost:27017 | Internal only |
| Redis | localhost:6379 | Internal only |

**To stop:**
```bash
docker-compose down              # stop
docker-compose down -v           # stop + delete database volumes
```

---

## 🔧 Manual Setup

Use this when you want hot-reload for active development.

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB 7.0 running locally (or a [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster)
- Redis 7.x running locally (or [Upstash](https://upstash.com) free tier)

---

### Step 1 — Clone

```bash
git clone https://github.com/your-username/curated-exchange.git
cd curated-exchange
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
.venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Create your environment file
cp .env.example .env
```

Open `.env` and fill in your values (see [Environment Variables](#-environment-variables) below).

```bash
# (Optional) Load sample data — creates users, auctions, bids
python seed.py

# Start the development server
uvicorn app.main:socket_app --reload --port 8000
```

Backend is now running at **http://localhost:8000**
Swagger docs at **http://localhost:8000/docs**

---

### Step 3 — Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Frontend is now running at **http://localhost:5173**

---

### Step 4 — Verify Everything Works

1. Open **http://localhost:5173** in your browser.
2. Click **Sign In** → use `admin@curated.com` / `Admin1234`.
3. You should see the dashboard with live and upcoming auctions.
4. Open a second browser window in incognito mode, log in as `user@curated.com`.
5. Navigate to a live auction on both windows — bids placed in one should appear instantly in the other.

---

## ⚙️ Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# ── Database ──────────────────────────────────────────
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=curated_exchange

# ── Redis ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── JWT — Access Token (short-lived) ──────────────────
# Generate: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=<your-strong-64-char-secret-here>
JWT_EXPIRE_MINUTES=20

# ── JWT — Refresh Token (long-lived, separate secret) ─
JWT_REFRESH_SECRET=<different-strong-64-char-secret>
JWT_REFRESH_EXPIRE_DAYS=7

# ── Admin Policy ──────────────────────────────────────
# true  → any email containing "admin" gets admin role (dev/demo only)
# false → admin role assigned via DB only (production)
ALLOW_EMAIL_ADMIN_HINT=true

# ── CORS ──────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# ── App ───────────────────────────────────────────────
ENVIRONMENT=development     # "development" | "production"
```

> ⚠️ **Never commit `.env` to git.** The `.gitignore` already excludes it.
> In production, `ENVIRONMENT=production` will crash startup if `JWT_SECRET` or `JWT_REFRESH_SECRET` are weak or default.

---

## 📡 API Reference

All responses follow a consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Human-readable message" }

// Paginated
{ "success": true, "data": [...], "pagination": { "total": 42, "page": 1, "limit": 10, "pages": 5 } }
```

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ✗ | Create new account |
| `POST` | `/api/auth/login` | ✗ | Returns `access_token` + `refresh_token` |
| `POST` | `/api/auth/refresh` | ✗ | Rotate refresh token → new pair |
| `POST` | `/api/auth/logout` | ✓ | Revoke refresh token |
| `GET` | `/api/auth/me` | ✓ | Current user profile |

**Rate limited:** `/login`, `/register`, `/refresh` — 5 requests per 15 minutes per IP.

### Auctions — `/api/auctions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/auctions` | ✗ | List all (filter: `status`, `category`, `search`) |
| `GET` | `/api/auctions/featured` | ✗ | Featured lots for homepage |
| `GET` | `/api/auctions/live` | ✗ | Status = LIVE |
| `GET` | `/api/auctions/upcoming` | ✗ | Status = SCHEDULED |
| `GET` | `/api/auctions/completed` | ✗ | Status = COMPLETED |
| `GET` | `/api/auctions/{id}` | ✗ | Single auction detail |
| `POST` | `/api/auctions` | Admin | Create auction |
| `PUT` | `/api/auctions/{id}` | Admin | Update auction |
| `DELETE` | `/api/auctions/{id}` | Admin | Delete auction |
| `PATCH` | `/api/auctions/{id}/status` | Admin | Force status change |
| `POST` | `/api/auctions/{id}/watch` | ✓ | Toggle watchlist |

### Bids — `/api/auctions/{id}/bids`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auctions/{id}/bids` | ✓ | Place a bid (core business logic) |
| `GET` | `/api/auctions/{id}/bids` | ✗ | Paginated bid history |

**Bid validation rules (server-enforced):**
1. User must be authenticated.
2. Auction status must be `LIVE`.
3. Current server time must be before `end_time`.
4. `amount` must be strictly greater than `current_bid`.
5. `amount` must be at least `current_bid + min_increment`.

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | ✓ | Profile |
| `PUT` | `/api/users/me` | ✓ | Update profile |
| `GET` | `/api/users/me/bids` | ✓ | Bidding history |
| `GET` | `/api/users/me/won` | ✓ | Won auctions |
| `GET` | `/api/users/me/watching` | ✓ | Watchlist |

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Platform summary stats |
| `GET` | `/api/admin/users` | Admin | All users |
| `PATCH` | `/api/admin/users/{id}/toggle-admin` | Admin | Grant/revoke admin |
| `GET` | `/api/admin/audit-logs` | Admin | All system events |

---

## ⚡ WebSocket Events

Connect to the Socket.IO server at `http://localhost:8000`.

### Client → Server (emit)

```javascript
// Join an auction room to receive live updates
socket.emit("join_auction", { auction_id: "abc123" });

// Leave a room
socket.emit("leave_auction", { auction_id: "abc123" });
```

### Server → Client (listen)

```javascript
// New bid placed — update UI immediately
socket.on("BID_PLACED", (data) => {
  // data: { auction_id, amount, bidder_name, bid_count, timestamp }
});

// Auction went live (SCHEDULED → LIVE)
socket.on("AUCTION_STARTED", (data) => {
  // data: { auction_id }
});

// Auction closed (LIVE → COMPLETED)
socket.on("AUCTION_ENDED", (data) => {
  // data: { auction_id, winning_bid, winner_id }
});
```

> Bidder names are anonymised in public broadcasts: `"Bidder 8492"` (last 4 chars of user ID).

---

## 🔐 Authentication Design

This project uses a **dual JWT strategy** — a short-lived access token for API calls and a long-lived refresh token for session continuity.

```
┌─────────────────────────────────────────────────────────────┐
│                      Token Lifecycle                        │
│                                                             │
│  Login → Access Token (20 min)  ┐                          │
│          Refresh Token (7 days) ┘ both returned            │
│                                                             │
│  API calls → Bearer <access_token>                         │
│                                                             │
│  Access expires → POST /auth/refresh with refresh_token    │
│                → new access_token + new refresh_token      │
│                → old refresh_token is REVOKED in DB        │
│                                                             │
│  Logout → refresh_token deleted from DB                     │
│                                                             │
│  Reuse attack detected (old token reused after rotation):   │
│  → ALL active refresh tokens for that user revoked          │
│  → LOGIN_FAILED_REUSE audit event written                   │
└─────────────────────────────────────────────────────────────┘
```

**Refresh token storage:** Stored as a `bcrypt` hash in the `refresh_tokens` MongoDB collection — never in plaintext.

**Password policy** (enforced at registration and password change):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

**Admin assignment:**

| `ALLOW_EMAIL_ADMIN_HINT` | Behaviour |
|---|---|
| `true` (dev/demo) | Any email containing `"admin"` → `is_admin: true` |
| `false` (production) | Admin role assigned only via `PATCH /admin/users/{id}/toggle-admin` |

---

## 🗄️ Database Schema

### Collections overview

```
users              → authentication, profile, admin flag
auctions           → lots, status state machine, current bid (atomic)
bids               → immutable bid history (one document per bid)
refresh_tokens     → hashed long-lived tokens per user session
collections        → private curated collections
audit_logs         → system-wide event trail
```

### Auction status state machine

```
DRAFT ──→ SCHEDULED ──→ LIVE ──→ COMPLETED
                          │
                          └──→ CANCELLED  (admin only)

Transitions:
  SCHEDULED → LIVE       APScheduler every 30s (start_time ≤ now)
  LIVE → COMPLETED       APScheduler every 30s (end_time ≤ now)
  * → CANCELLED          Admin action only
```

---

## ✨ Key Features

- **Live Bidding** — Socket.IO broadcasts new bids to all clients in under 50ms.
- **Race Condition Safety** — MongoDB atomic `find_one_and_update` with a `$lt` filter ensures only one winner when two bids arrive simultaneously.
- **Automatic Auction Transitions** — APScheduler promotes auctions between states every 30 seconds without any manual intervention.
- **Dual JWT Auth** — Short-lived access tokens + rotating refresh tokens with reuse detection.
- **Redis Rate Limiting** — Auth endpoints throttled per IP to prevent brute-force attacks.
- **Admin Command Centre** — Create, edit, manage auction status and users from a dedicated panel.
- **Private Collections** — Curated portfolios with access-request flow.
- **Watchlist & Won Items** — Users can follow auctions and review their bidding history.
- **Audit Trail** — Every bid, login failure, and state change written to `audit_logs`.

---

## 🎨 Design Choices

### Why FastAPI?

FastAPI's async-first design is a natural fit for a platform where many users are connected simultaneously via WebSocket and HTTP long-polling. It also generates OpenAPI documentation automatically, making API exploration and frontend integration faster.

### Why MongoDB?

Auction data is naturally document-shaped — an auction has an embedded image array, optional metadata fields (medium, provenance, dimensions) that vary by category, and a growing list of bid references. MongoDB handles this schema flexibility without nullable column sprawl. Beanie's ODM gives Pydantic type safety on top.

### Why separate JWT secrets?

Using the same secret for both access and refresh tokens means a leak compromises everything. Separate secrets limit blast radius — a leaked access token secret doesn't let an attacker mint refresh tokens, and vice versa.

### Why atomic `find_one_and_update` for bids?

When two users bid at the same millisecond, a naïve read-then-write creates a race condition where both bids are accepted. Using MongoDB's atomic filter `{ "current_bid": { "$lt": amount } }` inside the update operation means only the higher bid wins — at the database level, not the application level.

### Why APScheduler instead of a task queue?

For this scale, APScheduler running inside the FastAPI process is sufficient and simpler than setting up Celery + a message broker. The 30-second transition interval means auction start/end times are accurate to within half a minute — acceptable for this use case.

---

## 🧪 Running Tests

```bash
cd backend
pytest                          # all tests
pytest tests/test_auth.py -v    # auth tests only
pytest tests/test_bids.py -v    # bid logic tests only
pytest --cov=app                # with coverage report
```

Tests use `mongomock-motor` for an in-memory MongoDB — no real database connection needed.

---

## 📦 Requirements

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
motor==3.4.0
beanie==1.26.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-socketio==5.11.2
apscheduler==3.10.4
pydantic-settings==2.3.0
redis==5.0.4
python-multipart==0.0.9
python-dotenv==1.0.1
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.7
mongomock-motor==0.0.21
```

---

<div align="center">

Built with care for **The Curated Exchange** · 2024

</div>
