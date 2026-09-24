import { Home, MapPin, Droplet, Bell, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function Navbar({ searchQuery, setSearchQuery, showSearch = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
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
          <button 
            onClick={() => navigate('/home')}
            className={`flex items-center gap-2 px-4 h-full cursor-pointer transition-colors ${isActive('/home') ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50 font-semibold' : 'hover:text-blue-600'}`}>
            <Home size={18} /> Home
          </button>
          <button 
            onClick={() => navigate('/map')}
            className={`flex items-center gap-2 px-4 h-full cursor-pointer transition-colors ${isActive('/map') ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50 font-semibold' : 'hover:text-blue-600'}`}
          >
            <MapPin size={18} /> Map
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
          <button 
            onClick={() => navigate('/civic-reports')}
            className={`flex items-center gap-2 px-4 h-full cursor-pointer transition-colors ${isActive('/civic-reports') ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50 font-semibold' : 'hover:text-slate-800'}`}
          >
            <Droplet size={18} /> Civic Reports
          </button>
          <button 
            onClick={() => navigate('/report-symptom')}
            className={`flex items-center gap-2 px-4 h-full cursor-pointer transition-colors ${isActive('/report-symptom') ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50 font-semibold' : 'hover:text-slate-800'}`}
          >
            <Bell size={18} /> Report Symptom
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {showSearch && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests, reports, campaigns"
              value={searchQuery}
              onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
              className="bg-white border border-pink-200 shadow-sm rounded-md py-1.5 pl-9 pr-4 text-sm w-72 focus:outline-none focus:border-blue-500 placeholder-slate-400"
            />
          </div>
        )}

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 py-1.5 px-2 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold border border-blue-200">
                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700">{user.fullName}</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                <button 
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <User size={16} className="text-slate-400" /> Profile & Analytics
                </button>
                <div className="h-px bg-slate-100 w-full"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={16} className="text-red-400" /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-600 cursor-pointer">Login</button>
        )}
      </div>
    </nav>
  );
}
