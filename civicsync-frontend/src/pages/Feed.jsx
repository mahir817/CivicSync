import { useState, useEffect } from 'react';
import { 
  Home, 
  MapPin, 
  Bell, 
  Search, 
  AlertTriangle, 
  Heart, 
  MessageSquare, 
  Share2, 
  Droplet, 
  CloudRain, 
  CheckCircle2,
  ThumbsUp,
  Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import { 
  getStoredReports, 
  addReport, 
  confirmReport, 
  resolveCoordinates 
} from '../services/reportService';
import HealthAlertBanner from '../components/HealthAlertBanner';
import { campaignApi } from '../api/client';

export default function Feed() {
  const [activeFilter, setActiveFilter] = useState('[All]');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  
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

  const loadCampaigns = async () => {
    try {
      let backendData = [];
      try {
        const res = await campaignApi.getAll();
        if (Array.isArray(res.data)) {
          backendData = res.data;
        }
      } catch (apiErr) {
        try {
          const res = await fetch('/api/campaigns');
          if (res.ok) {
            backendData = await res.json();
          }
        } catch (e) {
          console.warn('Backend not responding, falling back to local storage', e);
        }
      }

      const storedReports = getStoredReports();
      const civicFeedItems = storedReports.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        status: r.type === 'verified' ? 'VERIFIED' : 'PENDING',
        location: r.locationName || r.location || 'Dhaka',
        goalAmount: r.goalAmount || null,
        raisedAmount: r.raisedAmount || 0,
        requesterName: r.requesterName || 'Citizen Reporter',
        createdAt: r.createdAt,
        confirmations: r.confirmations || 0,
        severity: r.severity,
        image: r.image,
        isCivic: r.isCivic || r.category === 'WATER_LOGGING'
      }));

      const backendIds = new Set(backendData.map(b => String(b.id)));
      const combined = [
        ...civicFeedItems.filter(c => !backendIds.has(String(c.id))),
        ...backendData
      ];

      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCampaigns(combined);
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();

    const handleReportsUpdate = () => {
      loadCampaigns();
    };

    window.addEventListener('civicsync:reports_updated', handleReportsUpdate);
    return () => {
      window.removeEventListener('civicsync:reports_updated', handleReportsUpdate);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!title || !description) return;

    try {
      setPostLoading(true);

      const coords = resolveCoordinates(location || 'Dhaka Center');

      // If category is WATER_LOGGING, handle as Civic Report
      if (category === 'WATER_LOGGING') {
        addReport({
          title,
          description,
          category: 'WATER_LOGGING',
          locationName: location || 'Dhaka City',
          position: coords,
          severity: 'Severe (Knee-deep)',
          requesterName: user ? user.fullName : 'Citizen Reporter',
          image: imagePreview
        });
        
        setTitle('');
        setDescription('');
        setLocation('');
        setImagePreview(null);
        setIsComposing(false);
        loadCampaigns();
        return;
      }

      // For standard campaigns (BLOOD, DISASTER, PET_CARE, CHARITY)
      if (token) {
        try {
          const payload = {
            title,
            description,
            category,
            location,
            goalAmount: goalAmount ? parseFloat(goalAmount) : null,
          };
          if (files && files.length > 0) {
            await campaignApi.createWithImages(payload, files);
          } else {
            await campaignApi.create(payload);
          }
        } catch (apiErr) {
          console.warn("Backend error, saving to local map store", apiErr);
        }
      }

      // Also pin to the map so it is immediately visible!
      addReport({
        title,
        description,
        category,
        locationName: location || 'Dhaka',
        position: coords,
        goalAmount: goalAmount ? parseFloat(goalAmount) : null,
        requesterName: user ? user.fullName : 'Citizen',
        type: 'verified',
        image: imagePreview
      });

      setTitle('');
      setDescription('');
      setLocation('');
      setGoalAmount('');
      setImagePreview(null);
      setIsComposing(false);
      loadCampaigns();
    } catch (err) {
      console.error(err);
      alert("Error posting request");
    } finally {
      setPostLoading(false);
    }
  };

  const handleConfirm = (id, e) => {
    if (e) e.stopPropagation();
    confirmReport(id);
    loadCampaigns();
  };

  const getCategoryIcon = (cat) => {
    const c = (cat || '').toUpperCase();
    if (c.includes('WATER') || c.includes('CLOG')) {
      return <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center text-xl">🌊</div>;
    }
    switch(c) {
      case 'BLOOD': 
        return <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"><Droplet className="text-red-500" size={20} fill="currentColor" /></div>;
      case 'DISASTER_RELIEF': 
        return <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><CloudRain className="text-amber-500" size={20} fill="currentColor" /></div>;
      case 'PET_CARE': 
        return <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-xl">🐾</div>;
      default: 
        return <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Heart className="text-emerald-500" size={20} fill="currentColor" /></div>;
    }
  };

  const filteredCampaigns = activeFilter === '[All]' 
    ? campaigns 
    : campaigns.filter(c => {
        const catClean = (c.category || '').replace('_', ' ').toUpperCase();
        return `[${catClean}]` === activeFilter.toUpperCase();
      });

  return (
    <div className="min-h-screen text-slate-800 font-['Inter']">

      {/* 1. Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-pink-100 h-16 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8 h-full">
          {/* Logo */}
          <div 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-xl font-bold text-blue-600 cursor-pointer"
          >
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">C</div>
            Civic<span className="text-slate-800">Sync</span>
          </div>

          {/* Nav Links */}
          <div className="flex h-full text-sm font-medium text-slate-500">
            <button className="flex items-center gap-2 px-4 h-full border-b-2 border-blue-600 text-blue-600 bg-blue-50/50 font-semibold cursor-pointer">
              <Home size={18} /> Home
            </button>
            <button 
              onClick={() => navigate('/map')}
              className="flex items-center gap-2 px-4 h-full hover:text-blue-600 transition-colors cursor-pointer"
            >
              <MapPin size={18} /> Map
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
            <button 
              onClick={() => navigate('/civic-reports')}
              className="flex items-center gap-2 px-4 h-full hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Droplet size={18} /> Civic Reports
            </button>
            <button 
              onClick={() => navigate('/report-symptom')}
              className="flex items-center gap-2 px-4 h-full hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Bell size={18} /> Report Symptom
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
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border border-pink-200 shadow-sm rounded-md py-1.5 pl-9 pr-4 text-sm w-72 focus:outline-none focus:border-blue-500 placeholder-slate-400"
            />
          </div>

          {user ? (
            <div onClick={() => navigate('/profile')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold border border-blue-200">
                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium">{user.fullName}</span>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-600 cursor-pointer">Login</button>
          )}
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-8 flex gap-8">
        
        {/* Left Column (Feed) */}
        <div className="flex-1 min-w-0">
          <HealthAlertBanner />
          
          <div className="flex items-center justify-between mb-6 mt-2">
            <h1 className="text-3xl font-bold text-slate-800">CivicSync Feed</h1>
            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
              Live Dhaka Updates
            </span>
          </div>

          {/* 2. Composer Bar */}
          <div className="bg-white border border-pink-100 shadow-sm rounded-xl p-4 mb-6 transition-all">
            {!isComposing ? (
              <div className="flex items-center gap-4 cursor-text" onClick={() => setIsComposing(true)}>
                <input
                  type="text"
                  placeholder={`What do you need help with, or what civic hazard do you see, ${user ? user.fullName.split(' ')[0] : 'Citizen'}?`}
                  className="flex-1 bg-transparent text-base focus:outline-none placeholder-slate-400 text-slate-800 pointer-events-none"
                  readOnly
                />
                <div className="flex gap-2">
                  <button className="px-6 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-500/20 cursor-pointer">
                    Create Report / Post
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Title of your request or civic alert..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold focus:outline-none placeholder-slate-400 text-slate-800 border-b border-slate-200 pb-2"
                  autoFocus
                />
                <textarea
                  placeholder="Describe your situation or civic hazard in detail..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none placeholder-slate-400 text-slate-600 resize-none h-20"
                />
                
                {imagePreview && (
                  <div className="relative inline-block mt-2">
                    <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded border border-slate-200 object-cover" />
                    <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">x</button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="text-sm border border-slate-200 rounded p-1.5 text-slate-700 outline-none bg-white font-medium"
                  >
                    <option value="BLOOD">🩸 Blood Donation</option>
                    <option value="WATER_LOGGING">🌊 Water-Clogging / Flooding</option>
                    <option value="PET_CARE">🐾 Pet Care</option>
                    <option value="DISASTER_RELIEF">⚠️ Disaster Relief</option>
                    <option value="CHARITY">🤝 Charity Aid</option>
                  </select>

                  <input 
                    type="text" 
                    placeholder="Location (e.g. Mirpur 10, Dhanmondi)" 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="text-sm border border-slate-200 rounded p-1.5 flex-1 min-w-[180px] outline-none text-slate-600"
                  />

                  {category !== 'WATER_LOGGING' && category !== 'BLOOD' && (
                    <input 
                      type="number" 
                      placeholder="Goal Amount ৳ (Optional)" 
                      value={goalAmount}
                      onChange={e => setGoalAmount(e.target.value)}
                      className="text-sm border border-slate-200 rounded p-1.5 w-44 outline-none text-slate-600"
                    />
                  )}
                  
                  <label className="text-sm border border-slate-200 rounded p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors">
                    <div className="flex items-center gap-1">
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx" onChange={handleImageChange} className="hidden" />
                      <span>📷 Add Photos/Docs</span>
                    </div>
                  </label>
                </div>
                
                {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
                {files.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    {files.length} file{files.length > 1 ? "s" : ""} selected: {files.map(f => f.name).join(", ")}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    📍 Automatically pins to Dhaka Live Map
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsComposing(false)} 
                      className="px-4 py-1.5 rounded text-sm font-medium text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handlePost} 
                      disabled={postLoading || !title || !description} 
                      className="px-6 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {postLoading ? 'Posting...' : 'Post & Pin to Map'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {['[All]', '[BLOOD]', '[WATER LOGGING]', '[PET CARE]', '[CHARITY]', '[DISASTER RELIEF]'].map((filter) => (
              <button 
                key={filter} 
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer ${
                  filter === activeFilter 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm font-semibold' 
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 transition-colors'
                }`}>
                {filter}
              </button>
            ))}
          </div>

          {/* 3. Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {loading ? (
              <div className="col-span-full py-16 flex justify-center text-slate-500">Loading campaigns & reports...</div>
            ) : filteredCampaigns.filter(c => 
              !searchQuery || 
              (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
              (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (c.location || '').toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white/50 border border-slate-200 rounded-xl border-dashed">
                <span className="text-5xl mb-4 opacity-50">📭</span>
                <p className="text-xl font-semibold text-slate-700 mb-2">No posts found</p>
                <p className="text-sm">Be the first to post a civic report or request.</p>
              </div>
            ) : (
              filteredCampaigns.filter(c => 
                !searchQuery || 
                (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.location || '').toLowerCase().includes(searchQuery.toLowerCase())
              ).map(camp => {
                const isWater = (camp.category || '').toUpperCase().includes('WATER');
                const isConfirmed = camp.status === 'VERIFIED' || (camp.confirmations && camp.confirmations >= 3);
                const needsDonation = ['BLOOD', 'CHARITY', 'DISASTER_RELIEF', 'PET_CARE'].includes(camp.category);

                return (
                  <div 
                    key={camp.id} 
                    onClick={() => navigate(`/post/${camp.id}`, { state: { post: camp } })} 
                    className="bg-white border border-pink-100 shadow-sm rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                  >
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        {getCategoryIcon(camp.category)}
                        <div>
                          {isWater ? (
                            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded w-fit mb-1 ${
                              isConfirmed ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              {isConfirmed ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                              {isConfirmed ? 'COMMUNITY CONFIRMED' : 'UNCONFIRMED HAZARD'}
                            </div>
                          ) : (
                            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded w-fit mb-1 ${
                              camp.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {camp.status === 'VERIFIED' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                              {camp.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                            </div>
                          )}
                          <div className="text-xs text-slate-500">by {camp.requesterName}</div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {camp.createdAt ? new Date(camp.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-2 text-slate-800 leading-snug">{camp.title}</h3>
                    
                    {/* Location */}
                    {camp.location && (
                      <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                        <MapPin size={13} className="text-blue-500" /> {camp.location}
                      </div>
                    )}

                    {/* Image Preview */}
                    {camp.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-slate-100">
                        <img src={camp.image} alt="Post Attachment" className="w-full h-32 object-cover" />
                      </div>
                    )}

                    {/* Description */}
                    <div className="text-sm text-slate-600 mb-4 flex-1">
                      <p className="line-clamp-3">{camp.description}</p>
                    </div>

                    {/* Specific Details */}
                    {isWater && (
                      <div className="mb-4 bg-sky-50 border border-sky-100 p-2.5 rounded-lg flex items-center justify-between">
                        <div className="text-xs text-sky-900">
                          <span className="font-semibold">{camp.confirmations || 0}</span> community confirmations
                        </div>
                        <button
                          onClick={(e) => handleConfirm(camp.id, e)}
                          className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-semibold px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <ThumbsUp size={12} /> Confirm This
                        </button>
                      </div>
                    )}

                    {camp.goalAmount != null && (
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-base font-bold text-slate-800">৳{camp.raisedAmount || 0}</span>
                          <span className="text-xs text-slate-500">/ ৳{camp.goalAmount} Raised</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, ((camp.raisedAmount || 0) / camp.goalAmount) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-between border-t border-slate-100 pt-3 text-slate-500 text-xs mt-auto">
                      <button className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <Heart size={15} /> Like
                      </button>
                      <button 
                        className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate(`/post/${camp.id}`, { state: { post: camp } }); 
                        }}
                      >
                        <MessageSquare size={15} /> Comment
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate('/map'); }}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        <MapPin size={15} /> View on Map
                      </button>
                      
                      {needsDonation && camp.goalAmount != null ? (
                        <button 
                          className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            navigate(`/post/${camp.id}`, { state: { post: camp } }); 
                          }}
                        >
                          <Heart size={15} /> Donate
                        </button>
                      ) : (
                        <button 
                          className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(`${window.location.origin}/post/${camp.id}`);
                              alert('Post link copied to clipboard!');
                            }
                          }}
                        >
                          <Share2 size={15} /> Share
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

          </div>
        </div>

        {/* Right Column (Live Interactive Map) */}
        <div className="w-[450px] hidden lg:flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                Dhaka Live Map
              </h2>
              <p className="text-xs text-slate-500">Click anywhere on map to pin reports</p>
            </div>
            <button 
              onClick={() => navigate('/map')}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 size={13} /> Full Map
            </button>
          </div>

          <div className="flex-1 bg-slate-900 shadow-xl border border-slate-800 rounded-xl overflow-hidden relative min-h-[640px] max-h-[800px]">
            <MapView height="100%" />
          </div>
        </div>
      </main>
    </div>
  );
}
