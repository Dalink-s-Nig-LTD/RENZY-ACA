import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LOGO_URL } from "../lib/constants";

export function Navbar({ onEnroll }: { onEnroll: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="renzy-nav">
        <div className="nav-container">
          <a href="/" className="logo-img">
            <img src={LOGO_URL} alt="Renzy Academy" />
            <span className="logo-text">RENZY<span className="logo-dot">.</span>ACADEMY</span>
          </a>
          <div className="nav-links">
            <a href="/#why" className="nav-link">Why PMI-ACP</a>
            <a href="/#curriculum" className="nav-link">Curriculum</a>
            <a href="/#pricing" className="nav-link">Pricing</a>
            <a href="/#faq" className="nav-link">FAQ</a>
          </div>
          <div className="nav-right">
            <button onClick={onEnroll} className="nav-cta">Enroll Now</button>
            <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
          <a href="/#why" className="mobile-link" onClick={() => setMobileOpen(false)}>Why PMI-ACP</a>
          <a href="/#curriculum" className="mobile-link" onClick={() => setMobileOpen(false)}>Curriculum</a>
          <a href="/#pricing" className="mobile-link" onClick={() => setMobileOpen(false)}>Pricing</a>
          <a href="/#faq" className="mobile-link" onClick={() => setMobileOpen(false)}>FAQ</a>
          <button onClick={() => { onEnroll(); setMobileOpen(false); }} className="btn-primary mobile-enroll-btn">Enroll Now</button>
        </div>
      </nav>
    </>
  );
}
