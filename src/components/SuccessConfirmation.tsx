import { Check } from "lucide-react";

export function SuccessConfirmation({ heading, message }: { heading: string; message: string }) {
  return (
    <div className="success-confirmation">
      <div className="success-icon"><Check size={32} /></div>
      <h3>{heading}</h3>
      <p>{message}</p>
    </div>
  );
}
