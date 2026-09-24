import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { civicReportApi } from "../api/client";
import Navbar from "../components/Navbar";

const STATUS_LABELS = {
  UNCONFIRMED: { label: "Unconfirmed", color: "#F59E0B", bg: "#FFFBEB" },
  CONFIRMED: { label: "Confirmed", color: "#E11D48", bg: "#FEF2F2" },
};

export default function CivicReportsFeed() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const userStr = localStorage.getItem('user');
  const isAuthenticated = !!userStr;

  const fetchReports = () => {
    setLoading(true);
    civicReportApi.getActive().then((res) => setReports(res.data)).finally(() => setLoading(false));
  };

  useEffect(fetchReports, []);

  const handleConfirm = async (id) => {
    await civicReportApi.confirm(id);
    fetchReports();
  };

  return (
    <div className="min-h-screen text-slate-800 font-['Inter'] bg-transparent">
      <Navbar />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Water-Clogging Reports</h1>
            <p className="text-slate-500 mt-1">Community alerts for waterlogged areas</p>
          </div>
          {isAuthenticated && (
            <Link to="/report-clogging" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md shadow-emerald-600/20 inline-flex items-center">
              <svg className="w-5 h-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report an area
            </Link>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <svg className="animate-spin mr-3 h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-medium text-lg">Loading reports...</span>
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-slate-500 font-medium text-lg">No active reports right now.</p>
            <p className="text-slate-400 mt-1">Roads look clear!</p>
          </div>
        )}

        <div className="space-y-5">
          {reports.map((r) => {
            const status = STATUS_LABELS[r.status] || STATUS_LABELS.UNCONFIRMED;
            return (
              <div 
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer group" 
                key={r.id}
                onClick={() => navigate(`/post/${r.id}`, { state: { post: { ...r, isCivic: true } } })}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center text-slate-700 font-medium bg-slate-100 px-3 py-1.5 rounded-lg text-sm">
                    <span className="mr-1.5">📍</span> {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase" style={{ color: status.color, backgroundColor: status.bg }}>
                    {status.label}
                  </span>
                </div>
                
                <p className="text-slate-800 text-lg leading-relaxed font-medium mb-4 group-hover:text-emerald-700 transition-colors">
                  {r.description}
                </p>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <p className="text-slate-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Reported by <span className="font-semibold text-slate-700 ml-1">{r.reporterName}</span> 
                    <span className="mx-2 text-slate-300">•</span> 
                    <span className={r.confirmationCount > 0 ? "text-emerald-600 font-medium" : ""}>
                      {r.confirmationCount} confirmation{r.confirmationCount !== 1 ? "s" : ""}
                    </span>
                  </p>

                  {isAuthenticated && (
                    <button 
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirm(r.id);
                      }}
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm This
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
