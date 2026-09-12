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
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-['Inter'] overflow-hidden">
      
      {/* 1. Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 bg-white/90 backdrop-blur-md border-b border-pink-100 h-16 shrink-0 z-50">
        <div className="flex items-center gap-8 h-full">
          {/* Logo */}
          <div 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-xl font-bold text-blue-600 cursor-pointer"
          >
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">C</div>
            Civic<span className="text-slate-800">Sync</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 ml-1">
              Live Map
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex h-full text-sm font-medium text-slate-500">
            <button 
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 px-4 h-full hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Home size={18} /> Home
            </button>
            <button className="flex items-center gap-2 px-4 h-full border-b-2 border-blue-600 text-blue-600 bg-blue-50/50 font-semibold cursor-pointer">
              <MapPin size={18} /> Map
            </button>
            <button 
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 px-4 h-full hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Bell size={18} /> Alerts
            </button>
          </div>
        </div>

        {/* User Info & Quick Action */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft size={14} /> Back to Feed
          </button>

          {user ? (
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold border border-blue-200">
                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-slate-700 hidden md:inline">{user.fullName}</span>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-600 cursor-pointer">Login</button>
          )}
        </div>
      </nav>

      {/* 2. Main Content Split View (Sidebar + Full Map) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side Panel: Reports List & Stats */}
        <aside className="w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden md:flex z-10 shadow-lg shadow-slate-200">
          
          {/* Stats Bar */}
          <div className="p-4 border-b border-slate-100 grid grid-cols-3 gap-2 text-center bg-slate-50">
            <div className="bg-white border border-sky-100 p-2 rounded-lg shadow-sm">
              <div className="text-sky-600 text-base font-bold">{waterCount}</div>
              <div className="text-[10px] text-slate-500 font-medium">Water Clogs</div>
            </div>
            <div className="bg-white border border-rose-100 p-2 rounded-lg shadow-sm">
              <div className="text-rose-600 text-base font-bold">{bloodCount}</div>
              <div className="text-[10px] text-slate-500 font-medium">Blood Needs</div>
            </div>
            <div className="bg-white border border-amber-100 p-2 rounded-lg shadow-sm">
              <div className="text-amber-600 text-base font-bold">{disasterCount}</div>
              <div className="text-[10px] text-slate-500 font-medium">Disasters</div>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white">
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
                className={`px-2.5 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer border ${
                  selectedFilter === f.id
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List of active pins in Dhaka */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50">
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
                  className={`p-3 rounded-xl border transition-all cursor-pointer bg-white ${
                    selectedReportId === rep.id 
                      ? 'border-blue-400 ring-2 ring-blue-500/20 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isWater 
                        ? (isConfirmed ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-sky-50 text-sky-700 border border-sky-200')
                        : (rep.type === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200')
                    }`}>
                      {rep.category.replace('_', ' ')}
                    </span>

                    {isWater ? (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {rep.confirmations || 0} confirms
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        {rep.type === 'verified' ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{rep.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{rep.description}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[170px] font-medium">
                      <MapPin size={11} className="text-blue-500 shrink-0" />
                      {rep.locationName || 'Dhaka'}
                    </span>

                    {isWater && (
                      <button
                        onClick={(e) => handleConfirm(rep.id, e)}
                        className="flex items-center gap-1 text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 px-2 py-0.5 rounded transition-colors cursor-pointer border border-sky-200 shadow-sm"
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
        <div className="flex-1 h-full relative bg-slate-100">
          <MapView height="100%" isFullScreen={true} />
        </div>
      </div>
    </div>
  );
}
