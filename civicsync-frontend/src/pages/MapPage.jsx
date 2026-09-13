import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Bell, ArrowLeft, ThumbsUp } from 'lucide-react';
import MapView from '../components/MapView';
import { civicReportApi, campaignApi } from '../api/client';

export default function MapPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [verifiedCampaigns, setVerifiedCampaigns] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchReports = () => {
    civicReportApi.getActive().then((res) => setReports(res.data)).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      civicReportApi.getActive(),
      campaignApi.getAll(), // no coordinates on these — shown as a list below the map, not as pins
    ])
      .then(([reportsRes, campaignsRes]) => {
        setReports(reportsRes.data);
        setVerifiedCampaigns(campaignsRes.data.filter((c) => c.status === 'VERIFIED'));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async (id, e) => {
    e.stopPropagation();
    await civicReportApi.confirm(id);
    fetchReports();
  };

  const confirmedCount = reports.filter((r) => r.status === 'CONFIRMED').length;
  const unconfirmedCount = reports.filter((r) => r.status === 'UNCONFIRMED').length;

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-['Inter'] overflow-hidden">

      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 bg-white/90 backdrop-blur-md border-b border-pink-100 h-16 shrink-0 z-50">
        <div className="flex items-center gap-8 h-full">
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
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-600 cursor-pointer">
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Sidebar */}
        <aside className="w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden md:flex z-10 shadow-lg shadow-slate-200 overflow-y-auto">

          {/* Stats — only reflect what the map actually plots (water-clogging) */}
          <div className="p-4 border-b border-slate-100 grid grid-cols-2 gap-2 text-center bg-slate-50">
            <div className="bg-white border border-sky-100 p-2 rounded-lg shadow-sm">
              <div className="text-sky-600 text-base font-bold">{unconfirmedCount}</div>
              <div className="text-[10px] text-slate-500 font-medium">Unconfirmed</div>
            </div>
            <div className="bg-white border border-rose-100 p-2 rounded-lg shadow-sm">
              <div className="text-rose-600 text-base font-bold">{confirmedCount}</div>
              <div className="text-[10px] text-slate-500 font-medium">Confirmed</div>
            </div>
          </div>

          {/* Water-clogging reports list */}
          <div className="p-3 space-y-2.5 bg-slate-50 border-b border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
              Water-Clogging Reports ({reports.length})
            </div>

            {loading && <p className="text-xs text-slate-400 px-1">Loading...</p>}
            {!loading && reports.length === 0 && (
              <p className="text-xs text-slate-400 px-1">No active reports right now.</p>
            )}

            {reports.map((rep) => {
              const isConfirmed = rep.status === 'CONFIRMED';
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
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isConfirmed
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {isConfirmed ? 'Confirmed' : 'Unconfirmed'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {rep.confirmationCount || 0} confirms
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2">{rep.description}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[170px] font-medium">
                      <MapPin size={11} className="text-blue-500 shrink-0" />
                      {rep.latitude.toFixed(4)}, {rep.longitude.toFixed(4)}
                    </span>

                    <button
                      onClick={(e) => handleConfirm(rep.id, e)}
                      className="flex items-center gap-1 text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 px-2 py-0.5 rounded transition-colors cursor-pointer border border-sky-200 shadow-sm"
                    >
                      <ThumbsUp size={10} /> +1 Confirm
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verified campaigns — no coordinates yet, shown as a plain list, not map pins */}
          <div className="p-3 space-y-2.5 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
              Verified Requests Nearby ({verifiedCampaigns.length})
            </div>
            <p className="text-[10px] text-slate-400 px-1 mb-1">
              These aren't pinned on the map yet — campaigns don't store coordinates currently.
            </p>
            {verifiedCampaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/post/${c.id}`)}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:shadow-sm transition-all"
              >
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{c.title}</h4>
                {c.location && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                    <MapPin size={11} className="text-blue-500 shrink-0" /> {c.location}
                  </span>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Map View */}
        <div className="flex-1 h-full relative bg-slate-100">
          <MapView height="100%" isFullScreen={true} reports={reports} selectedReportId={selectedReportId} />
        </div>
      </div>
    </div>
  );
}