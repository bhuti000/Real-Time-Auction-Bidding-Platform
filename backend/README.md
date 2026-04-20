# RTA - Backend Core

High-performance, asynchronous FastAPI backend powering real-time bidding, secure authentication, and automated auction management.

## ⚙️ Key Subsystems

- **Bidding Engine**: Handles atomic bid increments and real-time broadcasts.
- **Auth Guard**: State-of-the-art JWT security with refresh token rotation.
- **Scheduler**: Automated background tasks for auction lifecycle management.
- **Websocket Hub**: Central manager for multi-room event broadcasting.

## 🏛️ Design Choices

### Database Choice: MongoDB + Beanie
We chose MongoDB for its flexibility with varying auction item schemas (different attributes for art vs. collectibles) and Beanie for its modern, Pydantic-based ODM that provides runtime type safety.

### Asynchronous Operations
The entire backend is built on `async/await` patterns to ensure high concurrency, especially important for handling multiple active bidding wars simultaneously without blocking I/O.

### Real-Time Reliability
Socket.io was selected over raw WebSockets to provide built-in reconnection logic, room management, and fallback mechanisms for environments with restricted network connections.

## 🛠️ Development

1. **Environment**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Server**:
   ```bash
   uvicorn app.main:socket_app --reload --port 8000
   ```

3. **Check Quality**:
   ```bash
   pytest
   ```

---

> [!NOTE]
> Refer to the [Root README](../README.md) for full project architecture and Docker instructions.
