import { useState } from "react";
import { healthApi } from "../api/client";

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
      <div className="auth-page">
        <div className="auth-card">
          <h2>Thanks for the heads-up</h2>
          <p className="auth-subtitle">
            This helps flag early trends in your area — completely anonymous, no account needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Report a symptom</h2>
        <p className="auth-subtitle">
          Anonymous — this helps flag early health trends in your area before they become bigger outbreaks.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <label>Your area / neighborhood</label>
        <input
          required
          placeholder="e.g. Mirpur 10"
          value={form.area}
          onChange={(e) => setForm({ ...form, area: e.target.value })}
        />

        <label>What symptom?</label>
        <input
          required
          placeholder="e.g. fever, possible dengue symptoms"
          value={form.symptom}
          onChange={(e) => setForm({ ...form, symptom: e.target.value })}
        />

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit anonymously"}
        </button>
      </form>
    </div>
  );
}
