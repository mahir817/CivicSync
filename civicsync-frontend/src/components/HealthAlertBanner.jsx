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
    <div className="flex items-center gap-[10px] bg-[#FFFBEB] border border-[var(--warning)] rounded-[10px] py-[12px] px-[16px] mb-[20px] text-[13.5px]">
      <span className="text-[18px]">⚠️</span>
      <div>
        <strong>Health watch:</strong> elevated symptom reports in{" "}
        {watchAlerts.map((a) => a.area).join(", ")} over the last {watchAlerts[0].windowDays} days.
      </div>
    </div>
  );
}
