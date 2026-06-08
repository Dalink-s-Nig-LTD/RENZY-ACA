export interface FAQ {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
}

export const FAQ_DATABASE: FAQ[] = [
  { id: 1, question: "What are the prerequisites for PMI-ACP?",
    answer: "You need a secondary degree, 21 contact hours of Agile training, 12 months of general project experience within the last 5 years, and 8 months of Agile project experience within the last 3 years.",
    keywords: ["prerequisite", "requirement", "eligibility", "qualify", "qualification"] },
  { id: 2, question: "How long is the training?",
    answer: "Our PMI-ACP® Week-Day Prep runs for 40 hours over two intensive weeks, the Weekend Plan runs for six Saturdays, and the General Agile Project Management for Professionals is a pre-recorded self-paced study course.",
    keywords: ["how long", "duration", "length", "weeks", "hours", "time"] },
  { id: 3, question: "What does the training cost?",
    answer: "The PMI-ACP® Week-Day Prep and Weekend Plans are ₦200,000 each (regular ₦350,000). The General Agile Project Management for Professionals plan is ₦100,000 (regular ₦180,000). Flexible instalment plans are available — contact us for details.",
    keywords: ["price", "cost", "fee", "how much", "pricing", "payment", "instalment", "naira"] },
  { id: 4, question: "Do you offer exam application support?",
    answer: "Yes. Our program includes personalized PMI-ACP application review and submission guidance to help you successfully register for the exam.",
    keywords: ["exam", "application", "apply", "register", "schedule"] },
  { id: 5, question: "Are the sessions recorded?",
    answer: "Every live session is recorded and available in your portal within 24 hours, so you never miss a class.",
    keywords: ["recording", "recorded", "missed", "replay", "video"] },
  { id: 6, question: "What is the pass rate of your students?",
    answer: "Our students enjoy a 94% first-attempt pass rate — well above the global average of about 65%.",
    keywords: ["pass rate", "success", "first attempt", "results"] },
  { id: 7, question: "Do you provide a certificate of completion?",
    answer: "Yes. You receive a Renzy Academy certificate showing 40 contact hours, which counts toward PMI-ACP eligibility.",
    keywords: ["certificate", "completion", "contact hours", "pdu"] },
  { id: 8, question: "When is the next cohort?",
    answer: "The next cohort starts July 14, 2026. Seats are limited — enroll today to secure your spot!",
    keywords: ["next cohort", "start date", "when", "begin", "next batch", "july"] },
];

export function findRelevantFAQ(query: string): FAQ | null {
  const q = query.toLowerCase();
  let best: { faq: FAQ; score: number } | null = null;
  for (const faq of FAQ_DATABASE) {
    let score = 0;
    for (const k of faq.keywords) if (q.includes(k)) score += 2;
    for (const w of faq.question.toLowerCase().split(/\s+/)) {
      if (w.length > 3 && q.includes(w)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { faq, score };
  }
  return best?.faq ?? null;
}
