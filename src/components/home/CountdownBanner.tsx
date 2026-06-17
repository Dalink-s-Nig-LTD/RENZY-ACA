import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { NEXT_COHORT_DATE } from "../../lib/constants";

export function CountdownBanner() {
  const [t, setT] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = NEXT_COHORT_DATE.getTime() - Date.now();
      if (diff <= 0) return setT({ days: 0, hours: 0, mins: 0, secs: 0 });
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  const units: [string, number][] = [["Days", t.days], ["Hours", t.hours], ["Mins", t.mins], ["Secs", t.secs]];
  return (
    <div className="countdown-banner">
      <div className="countdown-label">
        <Calendar size={16} /> Next cohort starts in:
      </div>
      <div className="countdown-units">
        {units.map(([label, val]) => (
          <div key={label} className="countdown-unit">
            <span className="countdown-value">{String(val).padStart(2, "0")}</span>
            <span className="countdown-label-sm">{label}</span>
          </div>
        ))}
      </div>
      <div className="countdown-urgency">🔥 Limited spots — enroll today</div>
    </div>
  );
}
