import { useState, useEffect } from 'react';
import { Home, MapPin, Bell, User, Plus, Search, HelpCircle, AlertTriangle, ShieldQuestion, Heart, MessageSquare, Share2, Droplet, CloudRain, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const [activeFilter, setActiveFilter] = useState('[All]');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Composer state
  const [isComposing, setIsComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('BLOOD');
  const [location, setLocation] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [postLoading, setPostLoading] = useState(false);

  const navigate = useNavigate();

  // Get logged in user info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handlePost = async () => {
    if (!title || !description) return;
    if (!token) {
      alert("Please login to post");
      navigate('/login');
      return;
    }

    try {
      setPostLoading(true);
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          goalAmount: goalAmount ? parseFloat(goalAmount) : null
        })
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setLocation('');
        setGoalAmount('');
        setIsComposing(false);
        fetchCampaigns(); // Refresh feed
      } else {
        const err = await res.json();
        alert(err.message || "Failed to post");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting campaign");
    } finally {
      setPostLoading(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'BLOOD': return <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"><Droplet className="text-red-500" size={20} fill="currentColor" /></div>;
      case 'DISASTER_RELIEF': return <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center"><CloudRain className="text-slate-500" size={20} fill="currentColor" /></div>;
      case 'PET_CARE': return <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-xl">🐶</div>;
      default: return <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><Heart className="text-blue-500" size={20} fill="currentColor" /></div>;
    }
  };

  const filteredCampaigns = activeFilter === '[All]' 
    ? campaigns 
    : campaigns.filter(c => `[${c.category.replace('_', ' ')}]` === activeFilter.toUpperCase());

  return (
    <div className="min-h-screen text-slate-800 font-['Inter']">

      {/* 1. Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-pink-100 h-16 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8 h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">C</div>
            Civic<span className="text-slate-800">Sync</span>
          </div>

          {/* Nav Links */}
          <div className="flex h-full text-sm font-medium text-slate-500">
            <button className="flex items-center gap-2 px-4 h-full border-b-2 border-blue-600 text-blue-600 bg-blue-50/50">
              <Home size={18} /> Home
            </button>
            <button className="flex items-center gap-2 px-4 h-full hover:text-slate-800 transition-colors">
              <MapPin size={18} /> Map
            </button>
            <button className="flex items-center gap-2 px-4 h-full hover:text-slate-800 transition-colors">
              <Bell size={18} /> Alerts
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests, reports, campaigns"
              className="bg-white border border-pink-200 shadow-sm rounded-md py-1.5 pl-9 pr-4 text-sm w-72 focus:outline-none focus:border-blue-500 placeholder-slate-400"
            />
          </div>

          {user ? (
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold border border-blue-200">
                {user.fullName ? user.fullName.substring(0,2).toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium">{user.fullName}</span>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-600">Login</button>
          )}
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-8 flex gap-8">
        
        {/* Left Column (Feed) */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold mb-6 text-slate-800">CivicSync Feed</h1>

        {/* 2. Composer Bar */}
        <div className="bg-white border border-pink-100 shadow-sm rounded-xl p-4 mb-6 transition-all">
          {!isComposing ? (
            <div className="flex items-center gap-4 cursor-text" onClick={() => setIsComposing(true)}>
              <input
                type="text"
                placeholder={`What do you need help with, ${user ? user.fullName.split(' ')[0] : 'Citizen'}?`}
                className="flex-1 bg-transparent text-base focus:outline-none placeholder-slate-400 text-slate-800 pointer-events-none"
                readOnly
              />
              <div className="flex gap-2">
                <button className="px-6 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-500/20">
                  Create Post
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title of your request..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-bold focus:outline-none placeholder-slate-400 text-slate-800 border-b border-slate-200 pb-2"
                autoFocus
              />
              <textarea
                placeholder="Describe your situation in detail..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder-slate-400 text-slate-600 resize-none h-20"
              />
              <div className="flex gap-4">
                <select value={category} onChange={e => setCategory(e.target.value)} className="text-sm border border-slate-200 rounded p-1.5 text-slate-600 outline-none">
                  <option value="BLOOD">Blood Donation</option>
                  <option value="PET_CARE">Pet Care</option>
                  <option value="DISASTER_RELIEF">Disaster Relief</option>
                  <option value="CHARITY">Charity</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Location (Optional)" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="text-sm border border-slate-200 rounded p-1.5 flex-1 outline-none text-slate-600"
                />
                <input 
                  type="number" 
                  placeholder="Goal Amount ৳ (Optional)" 
                  value={goalAmount}
                  onChange={e => setGoalAmount(e.target.value)}
                  className="text-sm border border-slate-200 rounded p-1.5 w-48 outline-none text-slate-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setIsComposing(false)} className="px-4 py-1.5 rounded text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
                <button onClick={handlePost} disabled={postLoading || !title || !description} className="px-6 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50">
                  {postLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {['[All]', '[BLOOD]', '[PET CARE]', '[CHARITY]', '[DISASTER RELIEF]'].map((filter) => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border ${filter === activeFilter ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 transition-colors'}`}>
              {filter}
            </button>
          ))}
        </div>

        {/* 3. Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">

          {loading ? (
             <div className="col-span-full py-16 flex justify-center text-slate-500">Loading campaigns...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white/50 border border-slate-200 rounded-xl border-dashed">
              <span className="text-5xl mb-4 opacity-50">📭</span>
              <p className="text-xl font-semibold text-slate-700 mb-2">No posts yet</p>
              <p className="text-sm">Be the first to post a request.</p>
            </div>
          ) : (
            filteredCampaigns.map(camp => (
              <div key={camp.id} className="bg-white border border-pink-100 shadow-sm rounded-xl p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    {getCategoryIcon(camp.category)}
                    <div>
                      {camp.status === 'VERIFIED' ? (
                        <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded w-fit mb-1">
                          <CheckCircle2 size={12} /> VERIFIED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded w-fit mb-1">
                          <AlertTriangle size={12} /> PENDING
                        </div>
                      )}
                      <div className="text-xs text-slate-500">by {camp.requesterName}</div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(camp.createdAt).toLocaleDateString()}</span>
                </div>

                <h3 className="text-xl font-bold mb-3 text-slate-800">{camp.title}</h3>
                
                {camp.location && (
                  <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                    <MapPin size={14} /> {camp.location}
                  </div>
                )}

                <div className="text-sm text-slate-600 mb-4 flex-1">
                  <p>{camp.description}</p>
                </div>

                {camp.goalAmount != null && (
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-lg font-bold text-slate-800">৳{camp.raisedAmount || 0}</span>
                      <span className="text-xs text-slate-500">/ ৳{camp.goalAmount} Raised</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((camp.raisedAmount||0)/camp.goalAmount)*100)}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-4 text-slate-500 text-sm mt-auto">
                  <button className="flex items-center gap-2 hover:text-slate-800"><Heart size={16} /> Like</button>
                  <button className="flex items-center gap-2 hover:text-slate-800"><MessageSquare size={16} /> Comment</button>
                  <button className="flex items-center gap-2 hover:text-slate-800"><Share2 size={16} /> Share</button>
                </div>
              </div>
            ))
          )}

        </div>
        </div>

        {/* Right Column (Map) */}
        <div className="w-[400px] hidden lg:flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Map</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View Full Map
            </button>
          </div>
          <div className="flex-1 bg-white shadow-sm border border-pink-100 rounded-xl overflow-hidden relative min-h-[600px]">
            {/* Map Placeholder Image */}
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
              alt="Map View" 
              className="w-full h-full object-cover opacity-80" 
            />
            {/* Gradient Overlay for style */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
