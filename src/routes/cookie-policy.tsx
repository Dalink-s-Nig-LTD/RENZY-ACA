import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy | Renzy Academy" },
      { name: "description", content: "How Renzy Academy uses cookies and similar technologies on our website." },
      { property: "og:title", content: "Cookie Policy | Renzy Academy" },
      { property: "og:description", content: "How Renzy Academy uses cookies and similar technologies." },
      { property: "og:url", content: "https://www.renzyacademy.org/cookie-policy" },
    ],
    links: [
      { rel: "canonical", href: "https://www.renzyacademy.org/cookie-policy" },
    ],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
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
        <h1>Cookie Policy</h1>
        <p className="policy-updated">Last updated: June 2026</p>

        <section>
          <h2>1. What Are Cookies</h2>
          <p>Cookies are small text files that are placed on your device when you visit a website. They help us provide you with a better experience by remembering your preferences, understanding how you use our site, and improving our services.</p>
        </section>

        <section>
          <h2>2. How We Use Cookies</h2>
          <p>Renzy Academy uses cookies for the following purposes:</p>
          <ul>
            <li><strong>Essential cookies:</strong> Required for the website to function properly, such as maintaining your session and enabling secure logins.</li>
            <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our website so we can improve content and user experience.</li>
            <li><strong>Preference cookies:</strong> Remember your settings and choices, such as language or region preferences.</li>
            <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements and measure the effectiveness of our marketing campaigns.</li>
          </ul>
        </section>

        <section>
          <h2>3. Third-Party Cookies</h2>
          <p>We may allow trusted third-party services to place cookies on your device for analytics and advertising purposes. These include services like Google Analytics. These third parties have their own privacy and cookie policies.</p>
        </section>

        <section>
          <h2>4. Managing Cookies</h2>
          <p>You can control and manage cookies through your browser settings. Most browsers allow you to refuse or delete cookies. Please note that disabling certain cookies may affect the functionality of our website.</p>
        </section>

        <section>
          <h2>5. Changes to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated effective date.</p>
        </section>

        <section>
          <h2>6. Contact Us</h2>
          <p>If you have any questions about our Cookie Policy, please contact us at <a href="mailto:info@renzyacademy.org">info@renzyacademy.org</a>.</p>
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
