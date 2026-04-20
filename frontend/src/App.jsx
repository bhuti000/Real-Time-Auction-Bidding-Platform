import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { Bell, X } from 'lucide-react';
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

// Page imports
import Home from "./pages/home";
import LiveAuctions from "./pages/LiveAuctions";
import AuctionDetail from "./pages/AuctionDetail";
import UpcomingAuctions from "./pages/UpcomingAuctions";
import WishList from "./pages/WishList";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";

function NotificationListener() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const handleNotification = (e) => {
      setNotification(e.detail);
      // Auto-hide after 10 seconds
      setTimeout(() => setNotification(null), 10000);
    };

    window.addEventListener('app-notification', handleNotification);
    return () => window.removeEventListener('app-notification', handleNotification);
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-surface-container-highest border border-outline-variant shadow-2xl rounded-2xl p-4 flex gap-4 w-[350px]">
        <div className="bg-primary/10 p-2 rounded-xl h-fit">
          <Bell className="text-primary" size={20} />
        </div>
        <div className="flex-grow">
          <h4 className="font-headline font-bold text-on-surface text-sm">{notification.title}</h4>
          <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed">
            {notification.message}
          </p>
          {notification.auction_id && (
            <a 
              href={`/auction/${notification.auction_id}`} 
              className="inline-block mt-2 text-xs font-bold text-primary hover:underline"
              onClick={() => setNotification(null)}
            >
              View Auction
            </a>
          )}
        </div>
        <button 
          onClick={() => setNotification(null)}
          className="text-on-surface-variant hover:text-on-surface transition-colors h-fit p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** Layout wrapper for public-facing pages with Navbar + Footer */
function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col selection:bg-primary/10 selection:text-primary">
      <Navbar />
      <NotificationListener />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages with shared Navbar + Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/live-auctions" element={<LiveAuctions />} />
          <Route path="/upcoming" element={<UpcomingAuctions />} />
          <Route path="/wishlist" element={<WishList />} />
          <Route path="/auction/:id" element={<AuctionDetail />} />
        </Route>

        {/* Standalone pages (own layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
