# CivicSync Frontend Guide — Donations, Civic Reports & Health Alerts
### For: the Sprint 3/4 backend additions (Trust Engine completion + Civic Awareness features)

Covers three separate features. They don't depend on each other — build/test them independently.

---

## Part 1 — Donations (makes the "Donate" button actually do something)

### The core idea
Right now "Donate" is probably just a UI button that does nothing. This wires it to a real backend
call that records the donation and updates the campaign's `raisedAmount` for real.

Two donation types exist:
- **MONETARY** — a real amount, updates the progress bar
- **PLEDGE** — for things like blood ("I can donate"), no amount involved

### 1. `src/api/client.js` — add this

```js
export const donationApi = {
  getForCampaign: (campaignId) => api.get(`/campaigns/${campaignId}/donations`),
  create: (campaignId, data) => api.post(`/campaigns/${campaignId}/donations`, data),
};
```

### 2. `src/components/DonateModal.jsx` — new file

A single modal that adapts based on category — blood shows a pledge confirmation, everything else
with a `goalAmount` shows an amount input.

```jsx
import { useState } from "react";
import { donationApi } from "../api/client";

export default function DonateModal({ campaign, onClose, onSuccess }) {
  const isPledgeOnly = campaign.category === "BLOOD" || !campaign.goalAmount;
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = isPledgeOnly
        ? { type: "PLEDGE", message: message || null }
        : { type: "MONETARY", amount: parseFloat(amount), message: message || null };

      const res = await donationApi.create(campaign.id, payload);
      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't process this. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{isPledgeOnly ? "Confirm you can help" : "Make a donation"}</h2>
        <p className="auth-subtitle">{campaign.title}</p>

        {error && <div className="auth-error">{error}</div>}

        {!isPledgeOnly && (
          <>
            <label>Amount (BDT)</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </>
        )}

        <label>Message (optional)</label>
        <textarea
          rows={2}
          placeholder={isPledgeOnly ? "e.g. I can come by tomorrow morning" : "A note of support"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Submitting..." : isPledgeOnly ? "Confirm" : "Donate"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### 3. `src/pages/CampaignDetail.jsx` — wire the Donate button to open it

```jsx
import DonateModal from "../components/DonateModal";

// Add state:
const [showDonateModal, setShowDonateModal] = useState(false);
const [donations, setDonations] = useState([]);

// Fetch donations alongside the campaign:
useEffect(() => {
  donationApi.getForCampaign(id).then((res) => setDonations(res.data)).catch(() => {});
}, [id]);

// Replace the existing static Donate button with:
{campaign.status === "VERIFIED" && (
  <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => setShowDonateModal(true)}>
    {campaign.category === "BLOOD" ? "I can donate" : "Donate"}
  </button>
)}

{showDonateModal && (
  <DonateModal
    campaign={campaign}
    onClose={() => setShowDonateModal(false)}
    onSuccess={(newDonation) => {
      setDonations((prev) => [newDonation, ...prev]);
      // Refresh the campaign so the progress bar reflects the new raisedAmount
      campaignApi.getById(id).then((res) => setCampaign(res.data));
    }}
  />
)}

// Show the donor list as social proof, e.g. below the Trust Trail:
{donations.length > 0 && (
  <div className="donor-list">
    <h3>Supporters ({donations.length})</h3>
    {donations.map((d) => (
      <div key={d.id} className="donor-item">
        <strong>{d.donorName}</strong>
        {d.type === "MONETARY" && <span> donated {d.amount} BDT</span>}
        {d.type === "PLEDGE" && <span> pledged to help</span>}
        {d.message && <p className="donor-message">"{d.message}"</p>}
      </div>
    ))}
  </div>
)}
```

### `src/styles.css` — add

```css
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal-card {
  background: white; border-radius: 16px; padding: 28px; width: 100%; max-width: 400px;
  display: flex; flex-direction: column;
}
.modal-card h2 { color: var(--civic-blue); margin: 0 0 4px 0; }
.modal-card label { font-size: 13px; font-weight: 600; margin-top: 14px; margin-bottom: 6px; }
.modal-card input, .modal-card textarea {
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; font-family: inherit;
}
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-actions .btn-primary { flex: 1; margin-top: 0; }

.donor-list { margin-top: 28px; border-top: 1px solid var(--border); padding-top: 18px; }
.donor-list h3 { color: var(--civic-blue); font-size: 15px; margin-bottom: 12px; }
.donor-item { padding: 8px 0; font-size: 13.5px; }
.donor-message { color: var(--text-muted); font-size: 12.5px; margin: 2px 0 0 0; font-style: italic; }
```

---

## Part 2 — Civic Reports (water-clogging map feature)

This is a genuinely new section of the app, not an addition to an existing page. Two pieces:
a form to submit a report, and a feed/list to browse active reports (a full interactive map can
come later — start with a list view, since that's what the backend already fully supports).

### 1. `src/api/client.js` — add this

```js
export const civicReportApi = {
  getActive: () => api.get("/civic-reports"),
  create: (data) => api.post("/civic-reports", data),
  confirm: (id) => api.post(`/civic-reports/${id}/confirm`),
  resolve: (id) => api.put(`/civic-reports/${id}/resolve`),
};
```

### 2. `src/pages/ReportClogging.jsx` — new file

Uses the browser's Geolocation API to auto-fill coordinates, with manual entry as a fallback.

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { civicReportApi } from "../api/client";

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
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Report water-clogging</h2>
        <p className="auth-subtitle">Help neighbors avoid or prepare for a flooded area.</p>

        {error && <div className="auth-error">{error}</div>}

        <button type="button" className="btn-secondary-lg" onClick={useMyLocation} disabled={locating}>
          {locating ? "Locating..." : "📍 Use my current location"}
        </button>

        <label>Latitude</label>
        <input
          type="number" step="any" required
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
        />

        <label>Longitude</label>
        <input
          type="number" step="any" required
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
        />

        <label>What's happening here?</label>
        <textarea
          required rows={3}
          placeholder="e.g. Knee-deep water blocking the main road"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}
```

### 3. `src/pages/CivicReportsFeed.jsx` — new file (list view of active reports)

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { civicReportApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  UNCONFIRMED: { label: "Unconfirmed", color: "#F59E0B", bg: "#FFFBEB" },
  CONFIRMED: { label: "Confirmed", color: "#E11D48", bg: "#FEF2F2" },
};

export default function CivicReportsFeed() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

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
```

### 4. `src/App.jsx` — add the two new routes

```jsx
import ReportClogging from "./pages/ReportClogging";
import CivicReportsFeed from "./pages/CivicReportsFeed";

// Inside <Routes>:
<Route path="/civic-reports" element={<CivicReportsFeed />} />
<Route
  path="/report-clogging"
  element={
    <ProtectedRoute>
      <ReportClogging />
    </ProtectedRoute>
  }
/>
```

### 5. `src/components/Navbar.jsx` — add a link

```jsx
<Link to="/civic-reports">Civic Reports</Link>
```
(Add this next to the existing `<Link to="/">Home</Link>` line, visible to everyone regardless of login state, since browsing reports is public.)

**Note on the map itself:** this gives you a working list view backed by real data. An actual visual
map (pins on a Leaflet/Google Maps view) is a separate, bigger frontend task — worth doing as a
follow-up once the list view is confirmed working end-to-end, not blocking this sprint.

---

## Part 3 — Health Alerts (disease pre-alert, anonymous by design)

Two independent pieces: an anonymous submission form (no login needed — don't gate it behind
`ProtectedRoute`), and a place to display current alerts.

### 1. `src/api/client.js` — add this

```js
export const healthApi = {
  submitSymptom: (data) => api.post("/symptom-reports", data),
  getAlerts: () => api.get("/health-alerts"),
};
```

### 2. `src/pages/ReportSymptom.jsx` — new file (deliberately NOT wrapped in ProtectedRoute)

```jsx
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
```

### 3. `src/components/HealthAlertBanner.jsx` — new file (a small widget to drop on the Home page)

```jsx
import { useEffect, useState } from "react";
import { healthApi } from "../api/client";

export default function HealthAlertBanner() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    healthApi.getAlerts().then((res) => setAlerts(res.data)).catch(() => {});
  }, []);

  const watchAlerts = alerts.filter((a) => a.level === "WATCH");
  if (watchAlerts.length === 0) return null;

  return (
    <div className="health-alert-banner">
      <span className="health-alert-icon">⚠️</span>
      <div>
        <strong>Health watch:</strong> elevated symptom reports in{" "}
        {watchAlerts.map((a) => a.area).join(", ")} over the last {watchAlerts[0].windowDays} days.
      </div>
    </div>
  );
}
```

### 4. `src/pages/Home.jsx` — drop the banner in

```jsx
import HealthAlertBanner from "../components/HealthAlertBanner";

// Add right after the opening <div className="home-page">, before feed-header:
<HealthAlertBanner />
```

### 5. `src/App.jsx` — add the route (public, no ProtectedRoute wrapper)

```jsx
import ReportSymptom from "./pages/ReportSymptom";

<Route path="/report-symptom" element={<ReportSymptom />} />
```

### 6. `src/components/Navbar.jsx` — add a link, visible to everyone

```jsx
<Link to="/report-symptom">Report Symptom</Link>
```

### `src/styles.css` — add

```css
.health-alert-banner {
  display: flex; align-items: center; gap: 10px;
  background: #FFFBEB; border: 1px solid var(--warning);
  border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 13.5px;
}
.health-alert-icon { font-size: 18px; }
```

---

## Quick reference — what talks to what

| Feature | Frontend file(s) | Backend endpoint(s) |
|---|---|---|
| Donate to a campaign | `DonateModal.jsx`, `CampaignDetail.jsx`, `client.js` | `GET`/`POST /api/campaigns/{id}/donations` |
| Report water-clogging | `ReportClogging.jsx`, `client.js` | `POST /api/civic-reports` |
| Browse civic reports | `CivicReportsFeed.jsx`, `client.js` | `GET /api/civic-reports` |
| Confirm a civic report | `CivicReportsFeed.jsx` | `POST /api/civic-reports/{id}/confirm` |
| Submit a symptom (anonymous) | `ReportSymptom.jsx`, `client.js` | `POST /api/symptom-reports` |
| Show disease watch alerts | `HealthAlertBanner.jsx`, `Home.jsx` | `GET /api/health-alerts` |

---

## Important behavioral notes for your teammate

- **`ReportSymptom.jsx` must NOT be wrapped in `ProtectedRoute`.** The whole point of this feature
  is that it's anonymous — no login required, no user data attached. Gating it behind login defeats
  the design intent from the product spec.
- **Only `VERIFIED` campaigns should show the Donate button** — the backend rejects donations to
  `PENDING`/`REJECTED` campaigns with a 400 error, so hiding the button earlier (as the existing
  `CampaignDetail.jsx` code already does with `campaign.status === "VERIFIED"`) avoids a confusing
  failed request.
- **Civic reports and donations are intentionally kept on separate pages/nav links** — per the
  product's core design decision, civic awareness features must never look like they're tied to
  money. Don't cross-link "Report Clogging" and "Donate" flows in the UI.
- **The confirm button has no "already confirmed by you" check yet** (backend doesn't track that
  per-user currently — see the backend's known gaps). It's fine for a demo, but don't build UI that
  implies duplicate-prevention exists (e.g. don't disable the button after one click and call it done —
  a page refresh will let the same user confirm again, which is expected for now).

## Testing checklist
- [ ] Donate a monetary amount to a verified campaign — progress bar updates without a manual refresh
- [ ] Pledge to a blood campaign — shows up in the supporter list with no amount shown
- [ ] Try to donate to a PENDING campaign via direct URL — should fail gracefully, not crash
- [ ] Submit a civic report using "Use my location" — coordinates auto-fill correctly
- [ ] Confirm a report 3 times (as different logged-in accounts) — status flips to CONFIRMED
- [ ] Submit a symptom report while logged out — works with zero login prompts
- [ ] Submit 5+ symptom reports for the same area — a WATCH banner appears on Home
