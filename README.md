# Real-Time Auction & Bidding Platform (RTA)

A premium, high-performance web application for extraordinary asset bidding, featuring real-time updates, secure authentication, and curated auction experiences.

---

## 🏛️ Architecture Overview

The system follows a modern, decoupled client-server architecture designed for real-time interaction and horizontal scalability.

### 1. Frontend (The Curated Web)
- **Framework**: React 19 + Vite for ultra-fast HMR and build performance.
- **Styling**: Vanilla CSS for artisan-level design control, with subtle Tailwind utility support.
- **State Management**: 
  - **AuthContext**: Manages JWT-based user sessions.
  - **SocketContext**: Maintains a persistent WebSocket connection for real-time bid updates and notifications.
- **Real-time Engine**: Socket.io Client for bidirectional communication with automatic failover to long-polling.

### 2. Backend (FastAPI Core)
- **Framework**: FastAPI (Python 3.11+) offering high-performance asynchronous request handling.
- **Database (NoSQL)**: MongoDB with **Beanie ODM**, providing Type-Safe document mapping and complex query capabilities.
- **Cache & Rate Limiting**: Redis-backed rate limiting to protect sensitive endpoints from abuse.
- **Task Orchestration**: APScheduler manages background auction transitions (e.g., automatically moving auctions from "Upcoming" to "Live").

### 3. Real-Time Infrastructure
- **WebSocket Protocol**: Custom event-driven architecture that broadcasts bid changes, user activity, and live status updates to all connected clients instantly.

---

## 🎨 Design Choices

### 1. "Artisanal" Aesthetics
- **Color Palette**: Curated Material-3 inspired surface containers (Surface, Surface-Low, Surface-Lowest) for depth and focus.
- **Typography**: Modern, geometric sans-serif fonts to evoke a premium, high-end gallery feel.
- **Micro-Interactions**: Smooth hover transitions, heart-toggle animations, and live bidding status pulses to make the interface feel "alive."

### 2. Security First
- **State-of-the-Art Authentication**: Dual JWT system with short-lived **Access Tokens** and secure **Refresh Token** rotation to detect and prevent reuse attacks.
- **Role-Based Access**: Strict separation between Admin (management) and User (bidding) layers.

### 3. Real-Time & Resilience
- **Optimistic UI**: The interface remains responsive while waiting for server confirmation on bids.
- **Conflict Resolution**: The backend validates every bid amount and timestamp to ensure integrity in high-frequency bidding wars.

---

## 🛠️ Setup Instructions

### Option A: The Docker Experience (Recommended)
The fastest way to get the entire stack (Frontend, Backend, DB, Cache) running.

1. Ensure you have Docker and Docker Compose installed.
2. From the project root, run:
   ```bash
   docker-compose up --build
   ```
3. Access the platform:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000

---

### Option B: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env       # Update your mongo/redis URLs
uvicorn app.main:socket_app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the frontend at http://localhost:5173.

---

## 🚀 Core Features

- **Live Bidding**: Instant updates when a new bid is placed.
- **Upcoming Lots**: Preview and set reminders for future auctions.
- **Personalized Wish List**: Save auctions to track their progress.
- **Admin Command Center**: Complete control over auction statuses, lot creation, and user management.
- **Smart Notifications**: Global and private alerts when auctions start or bids are outmatched.

---

*This project was meticulously crafted for **The Curated Exchange**.*
