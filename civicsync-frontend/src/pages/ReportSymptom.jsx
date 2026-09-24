import { useState } from "react";
import { healthApi } from "../api/client";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function ReportSymptom() {
  const [form, setForm] = useState({ area: "", symptom: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await healthApi.submitSymptom(form);
      setSubmitted(true);
    } catch {
      setError("Couldn't submit this. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen font-['Inter'] bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Thanks for the heads-up!</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              This helps flag early trends in your area — completely anonymous, no account needed.
            </p>
            <Link to="/home" className="inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-colors">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-['Inter'] bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800">Report a symptom</h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Anonymous — this helps flag early health trends in your area before they become bigger outbreaks.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your area / neighborhood</label>
              <input
                required
                placeholder="e.g. Mirpur 10"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">What symptom?</label>
              <input
                required
                placeholder="e.g. fever, possible dengue symptoms"
                value={form.symptom}
                onChange={(e) => setForm({ ...form, symptom: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none flex justify-center items-center"
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit anonymously"
              )}
            </button>
            <Link to="/home" className="w-full block text-center py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold transition-all duration-200">
              Return to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
