// Copy that repeats as lists lives here so it can be edited in one place.

/** Membership price, shown on the landing page and /subscribe. */
export const MEMBERSHIP_PRICE = "₱500";

// "/#…" so the links also work from /subscribe.
export const navLinks = [
  { href: "/#method", label: "Method" },
  { href: "/#results", label: "Results" },
  { href: "/#how", label: "How it works" },
  { href: "/#join", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
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
    body: `A one-time ${MEMBERSHIP_PRICE} payment unlocks the full collection. No subscriptions, no renewals.`,
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

export type Faq = {
  question: string;
  answer: string;
  /** Optional link shown after the answer. */
  link?: { href: string; label: string };
};

export const faqs: Faq[] = [
  {
    question: "Which exam is IDLE Sets for?",
    answer:
      "The Licensure Examination for Interior Designers (LEID). Our current sets are built for LEID 2027 takers.",
  },
  {
    question: "Is it a subscription?",
    answer: `No. Membership is a one-time payment of ${MEMBERSHIP_PRICE}, with no monthly fees.`,
  },
  {
    question: "How is this different from reading a reviewer?",
    answer:
      "Instead of re-reading, you answer board-style questions from memory. That shows you exactly what you know and what you still need to work on.",
  },
  {
    question: "How do I join?",
    answer: `Fill out the membership form: sign in with your personal Google account, pay ${MEMBERSHIP_PRICE} through the InstaPay QR code, and upload your proof of payment. We'll give your email access once your registration is processed.`,
    link: { href: "/subscribe", label: "Go to the membership form" },
  },
];

/** /subscribe page copy. Facts mirror the Google Form's own description. */
export const membership = {
  summary:
    "One payment unlocks 3,500+ Interior Design board exam reviewer sets: tests and questionnaires covering history, construction and utilities, materials, professional practice, furniture design and construction, and color theory.",
  steps: [
    {
      title: "Sign in with your personal Google account",
      body: "The form records your email, and that's where your access goes.",
    },
    {
      title: "Enter your name and school",
      body: "Your full name and the school you attended.",
    },
    {
      title: `Pay ${MEMBERSHIP_PRICE}`,
      body: "Scan the InstaPay QR code in the form. Transfer fees may apply.",
    },
    {
      title: "Upload your proof of payment",
      body: "A screenshot or PDF, up to 10 MB. Agree to the terms, then submit.",
    },
  ],
  note: "All payments are final once your registration is processed.",
};
