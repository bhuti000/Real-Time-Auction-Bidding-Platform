import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Wallet, 
  History, 
  Trophy, 
  Plus, 
  ArrowRight, 
  LogOut,
  ShieldCheck,
  TrendingUp,
  Gavel
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, extractApiError } from '../lib/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'bids', label: 'My Bids', icon: History },
  { id: 'won', label: 'Won Items', icon: Trophy },
];

export default function Dashboard() {
  const { user, logout, refreshUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [myBids, setMyBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bidsRes, wonRes] = await Promise.all([
        api.get('/api/users/me/bids?limit=50'),
        api.get('/api/users/me/won')
      ]);
      setMyBids(bidsRes.data.data || []);
      setWonAuctions(wonRes.data.data || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const handleAddMoney = async (amount) => {
    setAddLoading(true);
    try {
      await api.post(`/api/users/me/add-money?amount=${amount}`);
      await refreshUser(); // Update global balance
      alert(`$${amount.toLocaleString()} added to your wallet!`);
    } catch (err) {
      alert(extractApiError(err, 'Failed to add money'));
    } finally {
      setAddLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      {/* Header */}
      <header className="bg-surface-container-lowest border-b border-surface-container-highest sticky top-0 z-40 shadow-premium">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-headline font-bold text-primary">
            <Gavel size={22} className="rotate-12" />
            The Curated Exchange
          </Link>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Balance</span>
              <span className="text-sm font-headline font-bold text-secondary">
                ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-full hover:bg-surface-container-low">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-screen-xl w-full mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex flex-col gap-2">
            <div className="p-4 mb-4 bg-primary/5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User size={24} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-on-surface truncate max-w-[140px]">{user.full_name}</span>
                <span className="text-xs text-on-surface-variant">Standard Account</span>
              </div>
            </div>

            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id 
                    ? 'bg-primary text-on-primary shadow-premium' 
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="flex-grow flex flex-col gap-6">
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Balance Card */}
                  <div className="bg-gradient-to-br from-secondary to-secondary-dim p-8 rounded-3xl text-on-secondary shadow-premium relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-700" />
                    <Wallet size={40} className="mb-6 opacity-80" />
                    <h3 className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-1">Your Wallet</h3>
                    <div className="text-4xl font-headline font-extrabold mb-8">
                      ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAddMoney(100)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">+$100</button>
                      <button onClick={() => handleAddMoney(1000)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">+$1k</button>
                      <button onClick={() => handleAddMoney(10000)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">+$10k</button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-premium flex flex-col justify-between border border-surface-container-highest">
                    <div>
                      <h3 className="font-headline font-bold text-xl mb-2">Account Status</h3>
                      <div className="flex items-center gap-2 text-secondary mb-6">
                        <ShieldCheck size={18} />
                        <span className="text-sm font-semibold">Identity Verified</span>
                      </div>
                    </div>
                    <Link to="/" className="w-full py-4 bg-surface-container-low hover:bg-surface-container-high rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-colors group">
                      Browse Auctions <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl shadow-premium overflow-hidden border border-surface-container-highest">
                  <div className="p-6 border-b border-surface-container-low flex items-center justify-between">
                    <h3 className="font-headline font-bold text-lg">Recent Bidding Activity</h3>
                    <button onClick={() => setActiveTab('bids')} className="text-sm text-primary font-bold">View History</button>
                  </div>
                  <div className="min-h-[200px]">
                    {myBids.length > 0 ? (
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-surface-container-low">
                          {myBids.slice(0, 5).map((bid) => (
                            <tr key={bid.id} className="hover:bg-surface-container-low/50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold">{bid.auction?.title}</div>
                                <div className="text-xs text-on-surface-variant">Placed {new Date(bid.placed_at).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-4 text-right font-headline font-bold text-secondary">
                                ${bid.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant opacity-60">
                        <Gavel size={40} className="mb-4" />
                        <p className="text-sm">You haven't placed any bids yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'bids' && (
              <div className="bg-surface-container-lowest rounded-3xl shadow-premium overflow-hidden border border-surface-container-highest">
                 <div className="p-6 border-b border-surface-container-low">
                    <h3 className="font-headline font-bold text-lg">Detailed Bid History</h3>
                 </div>
                 <table className="w-full text-left">
                   <thead>
                      <tr className="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                         <th className="px-6 py-4">Item</th>
                         <th className="px-6 py-4 text-right">My Bid</th>
                         <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-surface-container-low">
                      {myBids.map((bid) => (
                         <tr key={bid.id} className="hover:bg-surface-container-low/50">
                            <td className="px-6 py-4">
                               <div className="font-bold text-sm">{bid.auction?.title}</div>
                               <div className="text-xs text-on-surface-variant">Closed: {new Date(bid.auction?.end_time).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-headline font-bold text-secondary">
                               ${bid.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                 bid.auction?.status === 'LIVE' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-high text-on-surface-variant'
                               }`}>
                                 {bid.auction?.status || 'Ended'}
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                 </table>
              </div>
            )}

            {activeTab === 'won' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {wonAuctions.length > 0 ? wonAuctions.map(item => (
                  <div key={item.id} className="bg-surface-container-lowest rounded-3xl p-6 shadow-premium border border-surface-container-highest flex flex-col gap-4">
                     <div className="w-full aspect-square bg-surface-container-low rounded-2xl overflow-hidden">
                        {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20"><Gavel size={48} /></div>}
                     </div>
                     <div>
                        <h4 className="font-headline font-bold text-lg truncate">{item.title}</h4>
                        <p className="text-sm text-secondary font-bold">Winning Bid: ${item.current_bid.toLocaleString()}</p>
                     </div>
                     <Link to={`/auction/${item.id}`} className="mt-2 py-3 bg-secondary text-on-secondary rounded-xl text-center text-xs font-bold shadow-sm">View Item Details</Link>
                  </div>
                )) : (
                  <div className="col-span-full py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-surface-container-highest flex flex-col items-center justify-center text-on-surface-variant">
                    <Trophy size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">No items won yet. Start bidding!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}