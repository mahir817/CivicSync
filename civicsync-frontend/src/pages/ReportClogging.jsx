import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { civicReportApi } from "../api/client";
import Navbar from "../components/Navbar";

export default function ReportClogging() {
  const [form, setForm] = useState({ latitude: "", longitude: "", description: "" });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const useMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Enter coordinates manually or try again.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await civicReportApi.create({
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        description: form.description,
      });
      navigate("/civic-reports");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit this report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter']">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <form className="bg-white rounded-xl shadow-md p-8 w-full max-w-md" onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Report water-clogging</h2>
          <p className="text-slate-500 mb-6 text-sm">Help neighbors avoid or prepare for a flooded area.</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

          <button 
            type="button" 
            className="w-full bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors mb-6 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70" 
            onClick={useMyLocation} 
            disabled={locating}
          >
            {locating ? "Locating..." : "📍 Use my current location"}
          </button>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Latitude</label>
            <input
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              type="number" step="any" required
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Longitude</label>
            <input
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              type="number" step="any" required
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">What's happening here?</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              required rows={3}
              placeholder="e.g. Knee-deep water blocking the main road"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer" 
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit report"}
            </button>
            <Link to="/home" className="w-full block text-center py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-semibold transition-all duration-200">
              Return to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
