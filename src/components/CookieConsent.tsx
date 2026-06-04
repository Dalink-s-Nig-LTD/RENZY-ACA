import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "renzy_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-banner-text">
        We use cookies to improve your experience and analyse site traffic. Read our{" "}
        <Link to="/cookie-policy" className="cookie-banner-link">Cookie Policy</Link>.
      </div>
      <div className="cookie-banner-actions">
        <button type="button" className="btn-outline-primary cookie-btn" onClick={() => decide("rejected")}>
          Reject
        </button>
        <button type="button" className="btn-primary cookie-btn" onClick={() => decide("accepted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
