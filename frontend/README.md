# RTA - Frontend Interface

A premium, glassmorphic React application designed for the Curated Exchange bidding experience.

## ✨ Highlights

- **Dynamic Design System**: Uses a custom CSS variable-based design system for unified surfaces and semantic coloring.
- **Real-Time Integration**: Synchronized with the backend via Socket.IO for live bidding "heartbeat."
- **Persistent Search**: State-aware search bar that retains queries across page navigation.
- **Wish List system**: Personalized item tracking with immediate visual feedback.

## 🏢 Architecture & Design Choices

### Component Structure
- **Common**: Reusable UI primitives (Buttons, Inputs, Modals).
- **Auction**: Specialized components for bid cards, timers, and live interactions.
- **Context**: Global state management without the overhead of Redux, using React Context API.

### Aesthetics
The frontend uses a **Dark Material** aesthetic, emphasizing high-contrast action items (primary buttons) and muted, elegant background surfaces to keep the focus on the auction items.

## 🛠️ Development

Install dependencies:
```bash
npm install
```

Start the dev server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

---

> [!NOTE]
> Refer to the [Root README](../README.md) for full project architecture and Docker instructions.
