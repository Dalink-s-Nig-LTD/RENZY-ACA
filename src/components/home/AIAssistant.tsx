import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { findRelevantFAQ } from "../../lib/faq";
import { ModalOverlay } from "../ModalOverlay";
import { AiAssistantIcon } from "../AiAssistantIcon";

interface ChatMessage {
  id: string; text: string; sender: "user" | "assistant"; timestamp: Date; faqId?: number;
}

export function AIAssistant({ onClose, onConnectToLiveChat }: { onClose: () => void; onConnectToLiveChat: () => void }) {
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
