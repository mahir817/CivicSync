import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  MapPin, 
  Bell, 
  ArrowLeft,
  ThumbsUp
} from 'lucide-react';
import MapView from '../components/MapView';
import { getStoredReports, confirmReport } from '../services/reportService';

export default function MapPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState(() => getStoredReports());
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Get logged in user info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const handleUpdate = () => {
      setReports(getStoredReports());
    };
    window.addEventListener('civicsync:reports_updated', handleUpdate);
    return () => window.removeEventListener('civicsync:reports_updated', handleUpdate);
  }, []);

  const handleConfirm = (id, e) => {
    e.stopPropagation();
    confirmReport(id);
    setReports(getStoredReports());
  };

  const filteredReports = reports.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'WATER_LOGGING') return (r.category || '').toUpperCase().includes('WATER');
    if (selectedFilter === 'BLOOD') return (r.category || '').toUpperCase().includes('BLOOD');
    if (selectedFilter === 'DISASTER_RELIEF') return (r.category || '').toUpperCase().includes('DISASTER');
    if (selectedFilter === 'PET_CARE') return (r.category || '').toUpperCase().includes('PET');
    if (selectedFilter === 'CHARITY') return (r.category || '').toUpperCase().includes('CHARITY');
    return true;
  });

  const waterCount = reports.filter(r => (r.category || '').toUpperCase().includes('WATER')).length;
  const bloodCount = reports.filter(r => (r.category || '').toUpperCase().includes('BLOOD')).length;
  const disasterCount = reports.filter(r => (r.category || '').toUpperCase().includes('DISASTER')).length;

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 font-['Inter'] overflow-hidden">
      
      {/* 1. Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 h-16 shrink-0 z-50">
        <div className="flex items-center gap-8 h-full">
          {/* Logo */}
          <div 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-xl font-bold text-blue-500 cursor-pointer"
          >
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">C</div>
            Civic<span className="text-white">Sync</span>
            <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700 ml-1">
              Live Map
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex h-full text-sm font-medium text-slate-400">
            <button 
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 px-4 h-full hover:text-white transition-colors cursor-pointer"
            >
              <Home size={18} /> Home
            </button>
            <button className="flex items-center gap-2 px-4 h-full border-b-2 border-blue-500 text-blue-400 bg-blue-500/10 font-semibold cursor-pointer">
              <MapPin size={18} /> Map
            </button>
            <button 
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 px-4 h-full hover:text-white transition-colors cursor-pointer"
            >
              <Bell size={18} /> Alerts
            </button>
          </div>
        </div>

        {/* User Info & Quick Action */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Feed
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold border border-blue-400">
                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden md:inline">{user.fullName}</span>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-400 cursor-pointer">Login</button>
          )}
        </div>
      </nav>

      {/* 2. Main Content Split View (Sidebar + Full Map) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side Panel: Reports List & Stats */}
        <aside className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 hidden md:flex">
          
          {/* Stats Bar */}
          <div className="p-4 border-b border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div className="bg-sky-950/50 border border-sky-800/40 p-2 rounded-lg">
              <div className="text-sky-400 text-base font-bold">{waterCount}</div>
              <div className="text-[10px] text-slate-400">Water Clogs</div>
            </div>
            <div className="bg-rose-950/50 border border-rose-800/40 p-2 rounded-lg">
              <div className="text-rose-400 text-base font-bold">{bloodCount}</div>
              <div className="text-[10px] text-slate-400">Blood Needs</div>
            </div>
            <div className="bg-amber-950/50 border border-amber-800/40 p-2 rounded-lg">
              <div className="text-amber-400 text-base font-bold">{disasterCount}</div>
              <div className="text-[10px] text-slate-400">Disasters</div>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'WATER_LOGGING', label: '💧 Clogs' },
              { id: 'BLOOD', label: '🩸 Blood' },
              { id: 'DISASTER_RELIEF', label: '⚠️ Disaster' },
              { id: 'PET_CARE', label: '🐾 Pet' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List of active pins in Dhaka */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
              Active Dhaka Incidents ({filteredReports.length})
            </div>

            {filteredReports.map(rep => {
              const isWater = (rep.category || '').toUpperCase().includes('WATER');
              const isConfirmed = rep.type === 'verified' || (rep.confirmations && rep.confirmations >= 3);

              return (
                <div 
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedReportId === rep.id 
                      ? 'bg-slate-800 border-blue-500 shadow-md' 
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isWater 
                        ? (isConfirmed ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30')
                        : (rep.type === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30')
                    }`}>
                      {rep.category.replace('_', ' ')}
                    </span>

                    {isWater ? (
                      <span className="text-[10px] text-slate-400">
                        {rep.confirmations || 0} confirms
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {rep.type === 'verified' ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{rep.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{rep.description}</p>

                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 truncate max-w-[170px]">
                      <MapPin size={11} className="text-slate-500 shrink-0" />
                      {rep.locationName || 'Dhaka'}
                    </span>

                    {isWater && (
                      <button
                        onClick={(e) => handleConfirm(rep.id, e)}
                        className="flex items-center gap-1 text-[10px] font-semibold bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        <ThumbsUp size={10} /> +1 Confirm
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Area: Interactive MapView filling remaining viewport */}
        <div className="flex-1 h-full relative">
          <MapView height="100%" />
        </div>
      </div>
    </div>
  );
}
