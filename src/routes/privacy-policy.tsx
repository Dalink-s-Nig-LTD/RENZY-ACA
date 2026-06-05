import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Renzy Academy" },
      { name: "description", content: "How Renzy Academy collects, uses and protects your personal information." },
      { property: "og:title", content: "Privacy Policy | Renzy Academy" },
      { property: "og:description", content: "How Renzy Academy collects, uses and protects your personal information." },
      { property: "og:url", content: "https://renzyacademytest.lovable.app/privacy-policy" },
    ],
    links: [
      { rel: "canonical", href: "https://renzyacademytest.lovable.app/privacy-policy" },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="renzy policy-page">
      <nav className="renzy-nav">
        <div className="nav-container">
          <Link to="/" className="logo-img">
            <span className="logo-text">RENZY<span className="logo-dot">.</span>ACADEMY</span>
          </Link>
        </div>
      </nav>
      <main className="container policy-content">
        <h1>Privacy Policy</h1>
        <p className="policy-updated">Last updated: June 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>Renzy Academy ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li><strong>Personal Information:</strong> Name, email address, phone number, and professional details you provide when enrolling or contacting us.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited, time spent, and device information.</li>
            <li><strong>Payment Information:</strong> Billing details processed securely through our payment partners. We do not store full credit card numbers.</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and manage our training programs and services</li>
            <li>Process enrollments and payments</li>
            <li>Communicate with you about courses, updates, and offers</li>
            <li>Improve our website and course offerings</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your data with:</p>
          <ul>
            <li>Service providers who assist in delivering our services (e.g., payment processors, email platforms)</li>
            <li>PMI (Project Management Institute) for certification-related purposes, where applicable</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access, correct, or delete your personal information</li>
            <li>Withdraw consent for certain processing activities</li>
            <li>Request a copy of your data in a portable format</li>
            <li>Object to processing based on legitimate interests</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:info@renzyacademy.org">info@renzyacademy.org</a>.</p>
        </section>

        <section>
          <h2>7. Retention</h2>
          <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.</p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes by posting the updated policy on our website.</p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
          <p>Email: <a href="mailto:info@renzyacademy.org">info@renzyacademy.org</a><br />Phone: <a href="tel:+2349010692401">+234 901 069 2401</a></p>
        </section>
      </main>
      <footer className="renzy-footer">
        <div className="container">
          <p>© 2026 Renzy Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
