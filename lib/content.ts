// Copy that repeats as lists lives here so it can be edited in one place.

export const navLinks = [
  { href: "#method", label: "Method" },
  { href: "#results", label: "Results" },
  { href: "#how", label: "How it works" },
  { href: "#join", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export const heroStats = [
  { value: "89.77%", label: "of our members passed LEID 2026" },
  { value: "5", label: "members placed in the Top 10" },
];

export type QuizOption = { id: string; letter: string; text: string };

export const quiz = {
  question: "What study method is IDLE Sets designed around?",
  answerId: "d",
  options: [
    { id: "a", letter: "A", text: "Passive reading" },
    { id: "b", letter: "B", text: "Recognition-based learning" },
    { id: "c", letter: "C", text: "Note rewriting" },
    { id: "d", letter: "D", text: "Active recall" },
  ] satisfies QuizOption[],
};

export const marqueeWords = [
  "Design today",
  "Inspire tomorrow",
  "Focus",
  "Trust",
  "Create",
];

export const results = {
  passingRate: "89.77%",
  stats: [
    { value: "88", label: "members took LEID 2026" },
    { value: "79", label: "new licensed interior designers" },
    { value: "5", label: "topnotchers in the Top 10" },
  ],
  topnotchers: [
    { rank: "Top 2", name: "Arianne Mae Magat" },
    { rank: "Top 3", name: "Dens Franco" },
    { rank: "Top 4", name: "Nadine Andrea Barrozo" },
    { rank: "Top 9", name: "Darla Buenaseda" },
    { rank: "Top 10", name: "Maria Veronica Magallanes" },
  ],
};

export const method = {
  passive: [
    "Re-reading handouts and reviewers",
    "Recognizing answers you've already seen",
    "Rewriting notes until they look neat",
  ],
  active: [
    "Pull answers from memory, not from the page",
    "Treat every session as a performance check",
    "Find your weak spots before the board does",
  ],
};

export const steps = [
  {
    number: "01",
    title: "Join once",
    body: "A one-time payment unlocks the full collection. No subscriptions, no renewals.",
  },
  {
    number: "02",
    title: "Pick a set",
    body: "Sets are organized by subject, so you can go straight to the areas you're weakest in.",
  },
  {
    number: "03",
    title: "Answer from memory",
    body: "Board-style tests and questionnaires make you retrieve the answer, not just recognize it.",
  },
  {
    number: "04",
    title: "Check, then retake",
    body: "See exactly what you missed, review it, and run the set again until it sticks.",
  },
];

export const membershipPerks = [
  "The full collection of Interior Design board exam reviewer sets",
  "Tests and questionnaires that simulate board-level thinking",
  "Built around active recall",
];

export const affirmations = [
  "You are prepared",
  "You are capable",
  "You are worthy",
  "You are ready",
];

export const faqs = [
  {
    question: "Which exam is IDLE Sets for?",
    answer:
      "The Licensure Examination for Interior Designers (LEID). Our current sets are built for LEID 2027 takers.",
  },
  {
    question: "Is it a subscription?",
    answer: "No. Membership is a one-time payment.",
  },
  {
    question: "How is this different from reading a reviewer?",
    answer:
      "Instead of re-reading, you answer board-style questions from memory. That shows you exactly what you know and what you still need to work on.",
  },
  {
    question: "How do I join?",
    answer:
      "Send us a message on Instagram at @idlesets. We'll walk you through payment and send your access details.",
  },
];
