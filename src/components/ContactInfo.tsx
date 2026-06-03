import { Phone, Mail } from "lucide-react";

export function ContactInfo({ variant }: { variant: "inline" | "modal" | "footer" }) {
  return (
    <div className={`contact-info contact-${variant}`}>
      <a href="tel:+2348000000000" className="contact-item">
        <Phone size={16} /> +234 800 000 0000
      </a>
      <a href="mailto:hello@renzyacademy.com" className="contact-item">
        <Mail size={16} /> hello@renzyacademy.com
      </a>
    </div>
  );
}
