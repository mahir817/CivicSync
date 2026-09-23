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

      if (String(campaign.id).startsWith('report-') || isNaN(Number(campaign.id))) {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const localDonation = {
          id: 'don-' + Date.now(),
          campaignId: campaign.id,
          donorName: user ? user.fullName : 'Anonymous Supporter',
          type: payload.type,
          amount: payload.amount || 0,
          message: payload.message,
          createdAt: new Date().toISOString()
        };
        onSuccess(localDonation);
        onClose();
        return;
      }

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
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form 
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col" 
        onClick={(e) => e.stopPropagation()} 
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold text-slate-800 mb-1">
          {isPledgeOnly ? "Confirm you can help" : "Make a donation"}
        </h2>
        <p className="text-sm text-slate-500 mb-4">{campaign.title}</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

        {!isPledgeOnly && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount (BDT)</label>
            <input
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message (optional)</label>
          <textarea
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder={isPledgeOnly ? "e.g. I can come by tomorrow morning" : "A note of support"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-2">
          <button 
            type="button" 
            className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer" 
            disabled={submitting}
          >
            {submitting ? "Submitting..." : isPledgeOnly ? "Confirm" : "Donate"}
          </button>
        </div>
      </form>
    </div>
  );
}
