import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { civicReportApi } from "../api/client";

const STATUS_LABELS = {
  UNCONFIRMED: { label: "Unconfirmed", color: "#F59E0B", bg: "#FFFBEB" },
  CONFIRMED: { label: "Confirmed", color: "#E11D48", bg: "#FEF2F2" },
};

export default function CivicReportsFeed() {
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
    <div className="home-page">
      <div className="feed-header">
        <h1>Water-Clogging Reports</h1>
        {isAuthenticated && (
          <Link to="/report-clogging" className="btn-primary-sm" style={{ marginBottom: 16, display: "inline-block" }}>
            + Report an area
          </Link>
        )}
      </div>

      {loading && <p className="feed-status">Loading reports...</p>}
      {!loading && reports.length === 0 && <p className="feed-status">No active reports right now.</p>}

      <div className="feed-list">
        {reports.map((r) => {
          const status = STATUS_LABELS[r.status] || STATUS_LABELS.UNCONFIRMED;
          return (
            <div className="campaign-card" key={r.id}>
              <div className="campaign-card-header">
                <span className="campaign-category">📍 {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
                <span className="trust-badge" style={{ color: status.color, backgroundColor: status.bg }}>
                  {status.label}
                </span>
              </div>
              <p className="campaign-description">{r.description}</p>
              <p className="campaign-requester">Reported by {r.reporterName} · {r.confirmationCount} confirmation{r.confirmationCount !== 1 ? "s" : ""}</p>

              {isAuthenticated && (
                <button className="btn-primary-sm" style={{ marginTop: 10 }} onClick={() => handleConfirm(r.id)}>
                  Confirm This
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
