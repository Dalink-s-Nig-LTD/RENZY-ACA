import logoAsset from "../assets/renzy-logo.jpeg.asset.json";
export const LOGO_URL = logoAsset.url;

export const WHATSAPP_LINK = "https://wa.me/2349010692401";

export const BENEFITS: [string, string][] = [
  ["Faster Delivery", "Lead teams that ship value in shorter cycles with predictable cadence."],
  ["Adapt to Change", "Master frameworks built for uncertainty, pivots, and shifting priorities."],
  ["Lead Agile Teams", "Coach cross-functional squads, remove blockers, and inspire ownership."],
  ["Improve Satisfaction", "Increase stakeholder happiness through transparency and iterative delivery."],
  ["Global Recognition", "PMI-ACP is recognized by Fortune 500 employers in 200+ countries."],
  ["Cross-Industry Demand", "Open roles across tech, finance, healthcare, telecom, and government."],
];

export const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Telecommunications",
  "Government", "Consulting", "E-commerce", "Manufacturing",
];

export const AUDIENCE = [
  "Project Managers", "Scrum Masters", "Product Owners", "Team Leads",
  "Business Analysts", "Software Engineers", "Consultants", "Career Switchers",
];

export const TESTIMONIALS = [
  { name: "Adaeze O.", role: "Senior PM, Fintech", text: "Renzy's program rebuilt the way I think about delivery. I passed PMI-ACP on my first try and got promoted within 3 months." },
  { name: "Tunde A.", role: "Scrum Master, Telecom", text: "The live sessions and mock exams made all the difference. Practical, intense, and worth every minute." },
  { name: "Maryam I.", role: "Product Owner, SaaS", text: "Best investment in my career. The instructors are world-class and the community is incredible." },
];

export const CURRICULUM = [
  { module: "Module 1", title: "Agile Mindset & Principles", duration: "6h",
    topics: ["The Agile Manifesto in depth", "Lean & systems thinking", "Servant leadership", "Coaching vs managing"] },
  { module: "Module 2", title: "Scrum Framework Mastery", duration: "8h",
    topics: ["Roles, events & artifacts", "Backlog refinement", "Sprint planning & retrospectives", "Scaling Scrum (Nexus / LeSS)"] },
  { module: "Module 3", title: "Kanban, Lean & XP", duration: "7h",
    topics: ["Visualizing flow & WIP limits", "Cumulative flow diagrams", "Pair programming & TDD", "Continuous integration"] },
  { module: "Module 4", title: "Value-Driven Delivery", duration: "6h",
    topics: ["Prioritization (MoSCoW, WSJF)", "MVP & incremental delivery", "Earned value in Agile", "Risk-adjusted backlog"] },
  { module: "Module 5", title: "Stakeholders & Team Performance", duration: "7h",
    topics: ["Facilitation techniques", "Conflict resolution", "Emotional intelligence", "High-performing teams"] },
  { module: "Module 6", title: "Exam Strategy & Mock Tests", duration: "6h",
    topics: ["PMI-ACP exam blueprint", "3 full-length mock exams", "Time management strategies", "Application & scheduling support"] },
];

type PricingPlan = {
  name: string;
  price: string;
  regularPrice?: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  { name: "PMI-ACP® Exam Prep", price: "₦200,000", regularPrice: "₦350,000", period: "Save ₦150,000 — Promo ends June 20, 2026", description: "Two weeks intensive, instructor-led training.",
    features: ["Live instructor-led sessions", "PMI-ACP® exam-focused preparation", "Mock exams & practice questions", "Mentorship & post-training support", "Study resources & downloadable guides", "Career-focused coaching"],
    cta: "Enroll Now", popular: true },
];

// Next cohort: 30 days from now
export const NEXT_COHORT_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
