import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Zap, RefreshCw, Users, Smile, Award, Globe,
  ChevronDown, Check, Calendar, Send, Menu, X,
} from "lucide-react";

import {
  LOGO_URL, WHATSAPP_LINK, BENEFITS, INDUSTRIES, AUDIENCE,
  TESTIMONIALS, CURRICULUM, PRICING_PLANS, NEXT_COHORT_DATE,
} from "../lib/constants";
import { FAQ_DATABASE, findRelevantFAQ } from "../lib/faq";
import { SectionHeader } from "../components/SectionHeader";
import { ModalOverlay } from "../components/ModalOverlay";
import { SuccessConfirmation } from "../components/SuccessConfirmation";
import { ContactInfo } from "../components/ContactInfo";
import { AiAssistantIcon } from "../components/AiAssistantIcon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PMI-ACP Certification Training | Renzy Academy" },
      { name: "description", content: "Become PMI-ACP certified with Renzy Academy. Master Scrum, Kanban, Lean, XP and Hybrid Agile." },
      { property: "og:title", content: "PMI-ACP Certification Training | Renzy Academy" },
      { property: "og:description", content: "Become PMI-ACP certified with Renzy Academy." },
    ],
  }),
  component: Index,
});

function ScrollProgressBar() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="scroll-progress" style={{ width: `${width}%` }} />;
}

function CountdownBanner() {
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

function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const dur = 1800;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{count}{suffix}</>;
}

interface ChatMessage {
  id: string; text: string; sender: "user" | "assistant"; timestamp: Date; faqId?: number;
}

function AIAssistant({ onClose, onConnectToLiveChat }: { onClose: () => void; onConnectToLiveChat: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "1",
    text: "Hi! I'm Renzy's AI Assistant. I can answer common questions about PMI-ACP training, pricing, prerequisites, and more. What would you like to know?",
    sender: "assistant", timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), text: input, sender: "user", timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    const q = input;
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const faq = findRelevantFAQ(q);
      const reply: ChatMessage = faq
        ? { id: (Date.now() + 1).toString(), text: faq.answer, sender: "assistant", timestamp: new Date(), faqId: faq.id }
        : { id: (Date.now() + 1).toString(), text: "I'm not sure about that. Would you like to connect with our live support team?", sender: "assistant", timestamp: new Date() };
      setMessages((p) => [...p, reply]);
      setLoading(false);
    }, 500);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="ai-assistant">
        <div className="ai-header">
          <AiAssistantIcon />
          <div>
            <h3>Renzy AI Assistant</h3>
            <p>Instant answers to your questions</p>
          </div>
        </div>
        <div className="ai-messages">
          {messages.map((m) => (
            <div key={m.id} className={`ai-msg ai-msg-${m.sender}`}>{m.text}</div>
          ))}
          {loading && <div className="ai-msg ai-msg-assistant ai-typing"><span></span><span></span><span></span></div>}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="ai-form">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..." disabled={loading} className="ai-input" />
          <button type="submit" className="btn-primary ai-send"><Send size={16} /></button>
        </form>
        <button onClick={onConnectToLiveChat} className="ai-live-link">
          Connect to Live Support →
        </button>
      </div>
    </ModalOverlay>
  );
}

function LiveChatWidget({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Live chat:", { name, email, message });
    setSubmitted(true);
    setTimeout(onClose, 3000);
  };
  return (
    <ModalOverlay onClose={onClose}>
      {submitted ? (
        <SuccessConfirmation heading="Message Sent!" message="Our team will reach out to you shortly." />
      ) : (
        <>
          <h3>Live Support</h3>
          <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>Connect with our team</p>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Your Name *</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label>Message *</label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your question..." rows={4} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%" }}>Send to Support Team</button>
          </form>
          <div style={{ marginTop: "1.5rem" }}><ContactInfo variant="modal" /></div>
        </>
      )}
    </ModalOverlay>
  );
}

function EnrollForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enrollment:", form);
    setSubmitted(true);
    setTimeout(onClose, 3000);
  };
  return (
    <ModalOverlay onClose={onClose}>
      {submitted ? (
        <SuccessConfirmation heading="Application Received!" message="We will contact you within 24 hours." />
      ) : (
        <>
          <h3>Enroll in PMI-ACP Training</h3>
          <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>Fill this form and we'll reach out shortly.</p>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 ..." />
            </div>
            <div className="form-group">
              <label>Current Role</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Project Manager" />
            </div>
            <div className="form-group">
              <label>Message (Optional)</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Questions or preferred cohort?" rows={3} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%" }}>Submit Application</button>
          </form>
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}><ContactInfo variant="modal" /></div>
        </>
      )}
    </ModalOverlay>
  );
}

function CurriculumSection({ onEnroll }: { onEnroll: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="curriculum" className="curriculum-section">
      <div className="container">
        <SectionHeader label="Course Curriculum" title="What You'll Master in 40 Hours" />
        <div className="curriculum-list">
          {CURRICULUM.map((mod, idx) => (
            <div key={idx} className={`curriculum-item ${openIdx === idx ? "open" : ""}`}>
              <button className="curriculum-header" onClick={() => setOpenIdx(openIdx === idx ? null : idx)} aria-expanded={openIdx === idx}>
                <div className="curriculum-header-left">
                  <span className="curriculum-module">{mod.module}</span>
                  <span className="curriculum-title">{mod.title}</span>
                </div>
                <div className="curriculum-header-right">
                  <span className="curriculum-duration">⏱ {mod.duration}</span>
                  <ChevronDown className={`curriculum-chevron-svg ${openIdx === idx ? "rotated" : ""}`} />
                </div>
              </button>
              <div className={`curriculum-body ${openIdx === idx ? "expanded" : ""}`}>
                <ul>
                  {mod.topics.map((t) => (
                    <li key={t}><Check className="pricing-check-icon" /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className="curriculum-cta">
          <p className="curriculum-total">📚 40 hours total · 6 modules · Live sessions + recordings</p>
          <button onClick={onEnroll} className="btn-primary">Enroll & Get Full Access →</button>
        </div>
      </div>
    </section>
  );
}

function PricingSection({ onEnroll }: { onEnroll: () => void }) {
  return (
    <section id="pricing" className="pricing-section">
      <div className="container">
        <SectionHeader label="Pricing" title="Choose the Plan That Works for You" />
        <div className="pricing-grid">
          {PRICING_PLANS.map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.popular ? "popular" : ""}`}>
              {plan.popular && <div className="popular-badge">⭐ Most Popular</div>}
              <div className="pricing-header">
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-price">
                  {plan.regularPrice && <span className="pricing-regular">{plan.regularPrice}</span>}
                  {plan.price}
                </div>
                <div className="pricing-period">{plan.period}</div>
                <p className="pricing-desc">{plan.description}</p>
              </div>
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}><Check className="pricing-check-icon" /> {f}</li>
                ))}
              </ul>
              <button onClick={onEnroll} className={plan.popular ? "btn-primary" : "btn-outline-primary"} style={{ width: "100%", marginTop: "auto" }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="pricing-note">💳 Flexible payment plans available. Contact us for instalment options.</p>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <section id="faq" className="faq-section">
      <div className="container">
        <SectionHeader label="FAQ" title="Frequently Asked Questions" />
        <div className="faq-list">
          {FAQ_DATABASE.map((faq) => (
            <div key={faq.id} className={`faq-item ${openId === faq.id ? "open" : ""}`}>
              <button className="faq-question" onClick={() => setOpenId(openId === faq.id ? null : faq.id)} aria-expanded={openId === faq.id}>
                <span>{faq.question}</span>
                <ChevronDown className={`curriculum-chevron-svg ${openId === faq.id ? "rotated" : ""}`} />
              </button>
              <div className={`faq-answer ${openId === faq.id ? "expanded" : ""}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatsAppFAB() {
  return (
    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="whatsapp-fab" title="Chat on WhatsApp" aria-label="Chat on WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

const BENEFIT_ICONS = [Zap, RefreshCw, Users, Smile, Award, Globe];

function Index() {
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.4 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const openEnroll = () => setShowForm(true);

  return (
    <div className="renzy">
      <ScrollProgressBar />
      <WhatsAppFAB />
      {!showAI && (
        <button onClick={() => setShowAI(true)} className="ai-chat-button" title="Open AI Assistant" aria-label="Open AI Assistant">
          <AiAssistantIcon />
        </button>
      )}

      {showForm && <EnrollForm onClose={() => setShowForm(false)} />}
      {showAI && <AIAssistant onClose={() => setShowAI(false)} onConnectToLiveChat={() => { setShowAI(false); setShowLiveChat(true); }} />}
      {showLiveChat && <LiveChatWidget onClose={() => setShowLiveChat(false)} />}

      <nav className="renzy-nav">
        <div className="nav-container">
          <a href="/" className="logo-img">
            <img src={LOGO_URL} alt="Renzy Academy" />
            <span className="logo-text">RENZY<span className="logo-dot">.</span>ACADEMY</span>
          </a>
          <div className="nav-links">
            <a href="#why" className="nav-link">Why PMI-ACP</a>
            <a href="#curriculum" className="nav-link">Curriculum</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>
          <div className="nav-right">
            <button onClick={openEnroll} className="nav-cta">Enroll Now</button>
            <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
          <a href="#why" className="mobile-link" onClick={() => setMobileOpen(false)}>Why PMI-ACP</a>
          <a href="#curriculum" className="mobile-link" onClick={() => setMobileOpen(false)}>Curriculum</a>
          <a href="#pricing" className="mobile-link" onClick={() => setMobileOpen(false)}>Pricing</a>
          <a href="#faq" className="mobile-link" onClick={() => setMobileOpen(false)}>FAQ</a>
          <button onClick={() => { openEnroll(); setMobileOpen(false); }} className="btn-primary mobile-enroll-btn">Enroll Now</button>
        </div>
      </nav>

      <CountdownBanner />

      <section className="hero">
        <div className="hero-container">
          <div>
            <div className="hero-badge"><span className="dot"></span> PMI Authorized Training Partner</div>
            <h1>PMI-ACP Certification Is No Longer Optional. It Is a <span className="highlight">Global Career Advantage.</span></h1>
            <p className="hero-subtitle">Companies want professionals who can adapt quickly, manage change, lead agile teams, and deliver value faster in uncertain environments.</p>
            <div className="hero-stats" ref={statsRef}>
              <div className="stat"><span className="stat-number">{statsVisible ? <AnimatedCount target={21} suffix="%" /> : "0%"}</span><span className="stat-label">Higher Salary</span></div>
              <div className="stat"><span className="stat-number">{statsVisible ? <AnimatedCount target={6} /> : "0"}</span><span className="stat-label">Agile Frameworks</span></div>
              <div className="stat"><span className="stat-number">{statsVisible ? <AnimatedCount target={500} suffix="+" /> : "0+"}</span><span className="stat-label">Graduates</span></div>
            </div>
            <div className="hero-cta-group">
              <button onClick={openEnroll} className="btn-primary">Start Your Journey →</button>
              <a href="#why" className="btn-secondary">Learn More</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="card-header">
                <div className="card-icon">📜</div>
                <div>
                  <div className="card-title">PMI-ACP Certified</div>
                  <div className="card-subtitle">Project Management Institute</div>
                </div>
              </div>
              <p className="card-desc">Validates your ability to work in Agile environments using:</p>
              <div className="frameworks-grid">
                {["Scrum", "Kanban", "Lean", "XP", "Hybrid Agile", "Iterative"].map((f) => (
                  <div key={f} className="framework-tag"><Check className="hero-check-icon" /> {f}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="why-section">
        <div className="container">
          <SectionHeader label="Why PMI-ACP" title="Why Professionals Are Pursuing PMI-ACP" />
          <div className="benefits-grid">
            {BENEFITS.map(([title, desc], idx) => {
              const Icon = BENEFIT_ICONS[idx] || Zap;
              return (
                <div key={title} className="benefit-card">
                  <div className="benefit-icon-wrapper"><Icon className="benefit-icon-svg" /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="industries-section">
        <div className="container">
          <SectionHeader label="Global Demand" title="In Demand Across Industries" />
          <div className="industries-grid">
            {INDUSTRIES.map((n) => <div key={n} className="industry-card">{n}</div>)}
          </div>
        </div>
      </section>

      <CurriculumSection onEnroll={openEnroll} />

      <section className="audience-section">
        <div className="container">
          <SectionHeader label="Who Should Enroll" title="Perfect For Professionals Like You" />
          <div className="audience-grid">
            {AUDIENCE.map((n) => <div key={n} className="audience-card">{n}</div>)}
          </div>
        </div>
      </section>

      <PricingSection onEnroll={openEnroll} />

      <section className="testimonials-section">
        <div className="container">
          <SectionHeader label="Student Stories" title="Hear From Our Community" />
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card">
                <span className="quote-mark">"</span>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSection />

      <section id="enroll" className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="urgency-badge"><span className="fire">🔥</span> Limited Slots Available — Enroll Today</div>
            <h2>Position Yourself for Global Relevance</h2>
            <p>Do not wait until the market moves ahead without you.</p>
            <div className="cta-buttons">
              <button onClick={openEnroll} className="btn-white">Enroll Now</button>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-outline-white">WhatsApp Us</a>
            </div>
            <ContactInfo variant="inline" />
          </div>
        </div>
      </section>

      <footer className="renzy-footer">
        <div className="container">
          <a href="/" className="logo-img" style={{ justifyContent: "center", marginBottom: "1rem" }}>
            <img src={LOGO_URL} alt="Renzy Academy" />
            <span className="logo-text" style={{ color: "white" }}>RENZY<span style={{ color: "#E31B23" }}>.</span>ACADEMY</span>
          </a>
          <ContactInfo variant="footer" />
          <div className="footer-links" style={{ marginTop: "1rem" }}>
            <a href="/privacy-policy">Privacy Policy</a>
            <span style={{ color: "rgba(255,255,255,.3)" }}>|</span>
            <a href="/cookie-policy">Cookie Policy</a>
          </div>
          <p>© 2026 Renzy Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
