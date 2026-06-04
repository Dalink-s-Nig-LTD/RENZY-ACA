import { Phone, Mail } from "lucide-react";

export function ContactInfo({ variant }: { variant: "inline" | "modal" | "footer" }) {
  return (
    <div className={`contact-info contact-${variant}`}>
      <a href="tel:+2349010692401" className="contact-item">
        <Phone size={16} />
        <span>+234 901 069 2401</span>
      </a>
      <a href="mailto:info@renzyacademy.org" className="contact-item">
        <Mail size={16} />
        <span>info@renzyacademy.org</span>
      </a>
    </div>
  );
}
