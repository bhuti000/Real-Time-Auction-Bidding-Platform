import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Users,
  BarChart3,
  LogOut,
  TrendingUp,
  DollarSign,
  Activity,
  ShieldCheck,
  Gavel,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/admin/ProductForm';
import UserManagement from '../components/admin/UserManagement';
import { api, extractApiError, getApiBaseUrl } from '../lib/api';

const STATUS_STYLES = {
  LIVE: 'bg-secondary/10 text-secondary border border-secondary/20',
  SCHEDULED: 'bg-primary/10 text-primary border border-primary/20',
  COMPLETED: 'bg-green-100 text-green-700 border border-green-200 shadow-sm',
  DRAFT: 'bg-surface-container-highest text-on-surface-variant border border-surface-container-highest',
  CANCELLED: 'bg-red-50 text-red-600 border border-red-100',
};

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-premium flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-body text-on-surface-variant">{label}</span>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-headline font-extrabold text-on-surface">{value}</div>
        <div className="flex items-center gap-1 mt-1.5">
          <TrendingUp size={12} className="text-secondary" />
          <span className="text-xs text-on-surface-variant font-body">Live backend metric</span>
        </div>
      </div>
    </div>
  );
}

function ProductsTable({ products, onUpdateStatus, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-body">
            <th className="px-6 py-3">Item</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Start Bid</th>
            <th className="px-6 py-3">End Bid</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-low">
          {products.map((item) => (
            <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors group">
              <td className="px-6 py-4 font-body text-sm font-semibold text-on-surface">
                {item.title}
              </td>
              <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                {item.category}
              </td>
              <td className="px-6 py-4 font-body text-sm text-on-surface">
                ${Number(item.startBid || 0).toLocaleString()}
              </td>
              <td className="px-6 py-4 font-body text-sm font-bold text-secondary">
                ${Number(item.currentBid || 0).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold font-body capitalize ${
                    STATUS_STYLES[item.status] || STATUS_STYLES.DRAFT
                  }`}
                >
                  {item.status === 'COMPLETED' ? 'SOLD' : item.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    className="text-xs bg-surface-container-low border border-surface-container-highest rounded px-2 py-1 outline-none focus:border-primary"
                    value={item.status}
                    onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live</option>
                    <option value="COMPLETED">Sold</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-on-surface-variant hover:text-error transition-colors bg-surface-container-highest/30 rounded-lg"
                    title="Delete auction"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BidsHistoryTable({ bids }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-body">
            <th className="px-6 py-3">Bidder</th>
            <th className="px-6 py-3">Item</th>
            <th className="px-6 py-3">Amount</th>
            <th className="px-6 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-low">
          {bids.map((bid) => (
            <tr key={bid.id} className="hover:bg-surface-container-low/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-500">
              <td className="px-6 py-4 font-body text-sm font-semibold text-on-surface">
                {bid.bidder_name}
              </td>
              <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                {bid.auction_title}
              </td>
              <td className="px-6 py-4 font-body text-sm font-bold text-secondary">
                ${Number(bid.amount).toLocaleString()}
              </td>
              <td className="px-6 py-4 font-body text-xs text-on-surface-variant">
                {new Date(bid.placed_at).toLocaleTimeString()}
              </td>
            </tr>
          ))}
          {bids.length === 0 && (
            <tr>
              <td colSpan="4" className="px-6 py-12 text-center text-on-surface-variant text-sm font-body">
                No bids recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'bids', label: 'Live Bids', icon: Gavel },
  { id: 'users', label: 'Users', icon: Users },
];

export default function Admin() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [bids, setBids] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingAuction, setSavingAuction] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResponse, usersResponse, auctionsResponse] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users?page=1&limit=100'),
        api.get('/api/auctions?page=1&limit=100'),
      ]);

      const userData = usersResponse.data?.data || [];
      const auctionData = auctionsResponse.data?.data || [];

      setStats(statsResponse.data?.data || {});
      setUsers(
        userData.map((u) => ({
          id: u.id,
          full_name: u.full_name,
          name: u.full_name,
          email: u.email,
          is_admin: Boolean(u.is_admin),
        }))
      );
      setProducts(
        auctionData.map((auction) => ({
          id: auction.id,
          title: auction.title,
          category: auction.category,
          startBid: auction.starting_price,
          currentBid: auction.current_bid,
          status: auction.status,
        }))
      );
    } catch (err) {
      setError(extractApiError(err, 'Failed to load admin panel data'));
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async () => {
    try {
      const response = await api.get('/api/admin/bids');
      setBids(response.data.data);
    } catch (err) {
      setError(extractApiError(err, 'Failed to fetch bids'));
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData();
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (activeTab === 'bids') {
      loadBids();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const socket = io(getApiBaseUrl(), {
      withCredentials: true,
    });

    // Join admin room
    socket.emit('join', { room: 'admin' });

    socket.on('BID_PLACED', (data) => {
      // Prepend to the list
      setBids((prev) => {
        const newBid = {
          id: `live-${Date.now()}`,
          auction_id: data.auction_id,
          auction_title: data.auction_title,
          bidder_name: data.bidder_name,
          amount: data.amount,
          placed_at: data.timestamp,
        };
        // Keep last 50 bids in UI
        return [newBid, ...prev.slice(0, 49)];
      });

      // Update statistics if on overview
      if (activeTab === 'overview') {
        loadAdminData();
      }
    });

    return () => socket.disconnect();
  }, [isAuthenticated, isAdmin, activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateStatus = async (auctionId, newStatus) => {
    setActionError('');
    try {
      await api.patch(`/api/auctions/${auctionId}/status`, { status: newStatus });
      await loadAdminData();
    } catch (err) {
      setActionError(extractApiError(err, 'Failed to update status'));
    }
  };

  const handleDeleteAuction = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      return;
    }
    setActionError('');
    try {
      await api.delete(`/api/auctions/${auctionId}`);
      await loadAdminData();
    } catch (err) {
      setActionError(extractApiError(err, 'Failed to delete auction'));
    }
  };

  const handleAddProduct = async (formData) => {
    setActionError('');
    setSavingAuction(true);
    try {
      const startTime = formData.startTime
        ? new Date(formData.startTime)
        : new Date(Date.now() + 5 * 60 * 1000);
      const endTime = formData.endTime
        ? new Date(formData.endTime)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }

      const startBid = Number(formData.startBid || 1000);

      await api.post('/api/auctions', {
        title: formData.title,
        description: formData.description || `Lot for ${formData.title}`,
        category: formData.category || 'Fine Art',
        images: formData.imageUrl ? [formData.imageUrl] : [],
        starting_price: startBid,
        current_bid: startBid,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'SCHEDULED',
        min_increment: 500,
      });
      await loadAdminData();
      setActiveTab('products');
    } catch (err) {
      setActionError(err?.message || extractApiError(err, 'Failed to create auction'));
    } finally {
      setSavingAuction(false);
    }
  };

  const handleToggleUser = async (userId) => {
    setActionError('');
    try {
      const response = await api.patch(`/api/admin/users/${userId}/toggle-admin`);
      const updatedUser = response.data?.data;
      setUsers((prev) =>
        prev.map((userItem) =>
          userItem.id === userId
            ? {
                ...userItem,
                is_admin: Boolean(updatedUser?.is_admin),
              }
            : userItem
        )
      );
    } catch (err) {
      setActionError(extractApiError(err, 'Failed to update user'));
    }
  };

  const statsCards = useMemo(
    () => [
      { label: 'Total Users', value: Number(stats?.total_users || 0).toLocaleString(), icon: Users },
      { label: 'Live Auctions', value: Number(stats?.live_auctions || 0).toLocaleString(), icon: Activity },
      {
        label: 'Bids Today',
        value: Number(stats?.total_bids_today || 0).toLocaleString(),
        icon: Package,
      },
      {
        label: 'Revenue',
        value: `$${Number(stats?.revenue || 0).toLocaleString()}`,
        icon: DollarSign,
      },
    ],
    [stats]
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface p-8">
        <div className="max-w-xl mx-auto bg-surface-container-low rounded-xl p-6">
          <p className="text-on-surface mb-3">Please log in to access the admin panel.</p>
          <Link to="/login" className="text-primary font-semibold">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-surface-container-low rounded-3xl p-8 shadow-premium text-center">
          <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Access Denied</h2>
          <p className="text-on-surface-variant mb-8">
            You do not have admin access for this account.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-dim transition-colors"
            >
              Back to Home
            </Link>
            <button
              onClick={handleLogout}
              className="w-full py-3 border border-surface-container-highest text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <header className="bg-surface-container-lowest border-b border-surface-container-highest sticky top-0 z-40 shadow-premium">
        <div className="max-w-screen-2xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-headline font-bold text-primary"
            >
              <Gavel size={22} strokeWidth={2} />
              The Curated Exchange
            </Link>
            <span className="hidden sm:flex items-center gap-1.5 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck size={12} />
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-on-surface-variant truncate max-w-[200px]">
              {user?.full_name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-error transition-colors font-semibold"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            Admin Panel
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage auctions, users, and platform settings.
          </p>
        </div>

        <div className="flex gap-1 mb-8 bg-surface-container-low p-1.5 rounded-xl w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold font-headline transition-all duration-200 ${
                activeTab === id
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="bg-surface-container-low rounded-xl p-6 text-on-surface-variant text-sm">
            Loading admin data...
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {actionError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {!loading && !error && activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {statsCards.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-premium overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between border-b border-surface-container-low">
                <h3 className="font-headline font-bold text-lg text-on-surface">Recent Auctions</h3>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-sm text-primary font-semibold hover:text-primary-dim transition-colors"
                >
                  View all →
                </button>
              </div>
              <ProductsTable 
                products={products.slice(0, 10)} 
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteAuction}
              />
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'products' && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-premium">
              <h3 className="font-headline font-bold text-lg text-on-surface mb-6">
                Add New Auction
              </h3>
              {savingAuction && (
                <p className="text-sm text-on-surface-variant mb-4">Creating auction...</p>
              )}
              <ProductForm onSubmit={handleAddProduct} />
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-premium overflow-hidden">
              <div className="px-6 py-5 border-b border-surface-container-low">
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  All Products ({products.length})
                </h3>
              </div>
              <div className="overflow-hidden">
                <ProductsTable 
                  products={products} 
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDeleteAuction}
                />
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'bids' && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-premium overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-low flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-on-surface">
                Global Live Bids
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-xs text-on-surface-variant font-body">Live monitoring</span>
              </div>
            </div>
            <div className="min-h-[400px]">
              <BidsHistoryTable bids={bids} />
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'users' && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-premium overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-low flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-on-surface">
                User Management ({users.length})
              </h3>
              <span className="text-xs text-on-surface-variant font-body">
                {users.filter((u) => u.is_admin).length} admins
              </span>
            </div>
            <div className="p-6">
              <UserManagement users={users} onToggleUserStatus={handleToggleUser} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
