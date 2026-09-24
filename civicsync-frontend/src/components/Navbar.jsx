import { Home, MapPin, Droplet, Bell, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import logoImg from '../assets/logo.png';

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
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#18181B] rounded-full p-2 pl-2 pr-2 border border-zinc-800 shadow-2xl backdrop-blur-md flex items-center justify-between gap-6 w-max">
      
      {/* 2. Left Element (Logo Badge) */}
      <div 
        onClick={() => navigate('/home')}
        className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden"
      >
        <img src={logoImg} alt="CivicSync" className="w-6 h-6 object-contain" />
      </div>

      {/* 3. Middle Links */}
      <div className="flex items-center gap-6 md:gap-8 px-2">
        <button 
          onClick={() => navigate('/home')}
          className={`text-sm font-medium transition-colors ${isActive('/home') ? 'text-white' : 'text-zinc-300 hover:text-white'}`}
        >
          Home
        </button>
        <button 
          onClick={() => navigate('/map')}
          className={`text-sm font-medium transition-colors ${isActive('/map') ? 'text-white' : 'text-zinc-300 hover:text-white'}`}
        >
          Map
        </button>
        <button 
          onClick={() => navigate('/report-symptom')}
          className={`text-sm font-medium transition-colors ${isActive('/report-symptom') ? 'text-white' : 'text-zinc-300 hover:text-white'}`}
        >
          Alerts
        </button>
        <button 
          onClick={() => navigate('/civic-reports')}
          className={`text-sm font-medium transition-colors ${isActive('/civic-reports') ? 'text-white' : 'text-zinc-300 hover:text-white'}`}
        >
          Civic Reports
        </button>
      </div>

      {/* Optional Search Bar integrated into the dark theme */}
      {showSearch && (
        <div className="relative hidden lg:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
            className="bg-zinc-800/50 border border-zinc-700 rounded-full py-1.5 pl-8 pr-4 text-xs w-48 text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder-zinc-500 transition-all"
          />
        </div>
      )}

      {/* 4. Right Element (CTA / User Badge) */}
      <div className="flex items-center">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className="bg-white text-zinc-950 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-2"
            >
              {user.fullName ? user.fullName.split(' ')[0] : 'User'}
              <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-[#18181B] rounded-xl shadow-xl border border-zinc-800 overflow-hidden z-50">
                <button 
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                >
                  <User size={16} /> Profile & Analytics
                </button>
                <div className="h-px bg-zinc-800 w-full"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors text-left"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')} 
            className="bg-white text-zinc-950 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 transition-colors"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
