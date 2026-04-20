import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Bell, CircleUser } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { label: 'Live Auctions', to: '/live-auctions' },
  { label: 'Upcoming', to: '/upcoming' },
  { label: 'Wish List', to: '/wishlist' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Synchronize input with URL changes (e.g., when clearing search)
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/live-auctions?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/live-auctions');
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-premium">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto gap-6">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold tracking-tighter text-primary font-headline shrink-0"
        >
          The Curated Exchange
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1 font-headline text-sm font-semibold">
          {navLinks.map(({ label, to }) => {
            const isActive = to !== '#' && location.pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className={`relative px-3 py-2 transition-colors rounded-lg ${
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Search + Icons */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {/* Search bar */}
          <form 
            onSubmit={handleSearch}
            className="relative"
          >
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            />
            <input
              type="text"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search auctions..."
              aria-label="Search auctions"
              className="h-9 w-52 pl-9 pr-3 rounded-xl bg-surface-container-low border border-surface-container-highest text-sm font-body text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
            />
          </form>

          {/* User / Login */}
          {user ? (
            <Link
              to={user.is_admin ? "/admin" : "/dashboard"}
              aria-label="Account"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <CircleUser size={20} />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 bg-gradient-to-br from-primary to-primary-dim text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity font-headline"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
