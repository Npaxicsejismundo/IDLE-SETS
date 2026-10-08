// The reviewer sets members see in /members, in the order they're listed.
//
// Each set opens its Google Form. To let members answer a set inside the site
// instead (instant feedback, saved progress, results), add its questions as
// content/sets/<slug>.csv — see content/sets/README.md. Once that file exists
// the set opens in the site and its Google Form link is no longer used.

export type Subject = {
  id: string;
  /** Section heading on the Sets page. */
  title: string;
  /** Short name for the Home page list. */
  short: string;
};

export type SetInfo = {
  /** Used in the address (/members/sets/<slug>) and for content/sets/<slug>.csv. */
  slug: string;
  subject: Subject["id"];
  title: string;
  /** Shown as "Set 07". Leave out for sets that aren't numbered. */
  number?: number;
  /** Google Form members open when the set has no CSV. */
  formUrl?: string;
  /** Only shown when running the site on your computer (npm run dev). */
  devOnly?: boolean;
};

export const SUBJECTS: Subject[] = [
  { id: "starters", title: "IDLE Set Starters", short: "Starters" },
  { id: "history", title: "History of Interior Design", short: "History" },
  { id: "materials", title: "Materials of Decoration", short: "Materials" },
  {
    id: "construction",
    title: "Building Construction and Utilities",
    short: "Construction & Utilities",
  },
  { id: "furniture", title: "Furniture Design and Construction", short: "Furniture Design" },
  { id: "practice", title: "Professional Practice and Ethics", short: "Professional Practice" },
  { id: "color", title: "Color Theory", short: "Color Theory" },
];

// Links from the IDLE Sets Linktree. Editor links (…/edit) were changed to
// the fill-in version (…/viewform) so members don't land on a "no access" page.
const ALL_SETS: SetInfo[] = [
  {
    slug: "example",
    subject: "starters",
    title: "Example set",
    devOnly: true,
  },
  {
    slug: "free-starter",
    subject: "starters",
    title: "IDLE Free Starter Set",
    formUrl: "https://forms.gle/U5xee11uYxiMzXAJ8",
  },
  {
    slug: "history-1",
    subject: "history",
    title: "History of Interior Design Part 1",
    number: 1,
    formUrl: "https://docs.google.com/forms/d/1I1U7b6WyFzjA3pnk-V1r1mchqopfiY4tCi5klmqmmyE/viewform",
  },
  {
    slug: "history-2",
    subject: "history",
    title: "History of Interior Design Part 2",
    number: 2,
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdVLEVZLczlascZKAmvGxGDdpLzW449YAa6AeziTgbsPhwLgA/viewform",
  },
  {
    slug: "history-3",
    subject: "history",
    title: "History of Interior Design Part 3",
    number: 3,
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLScMHQeBL-2QJFH0-v-Aqec0oF9qZLiFrVktQnuEwPe4fhFE8w/viewform",
  },
  {
    slug: "history-4",
    subject: "history",
    title: "History of Interior Design Part 4",
    number: 4,
    formUrl: "https://docs.google.com/forms/d/12kMXFGIf55Hy6OzdhtJH0MraLSaVq83QC6tXZHUubU0/viewform",
  },
  {
    slug: "history-5",
    subject: "history",
    title: "History of Interior Design Part 5",
    number: 5,
    formUrl: "https://forms.gle/EDWEo2MwNCazfndU6",
  },
  {
    slug: "materials-1",
    subject: "materials",
    title: "Materials of Decoration Part 1",
    number: 6,
    formUrl: "https://docs.google.com/forms/d/1N2D__H-8NJsKsjwTQulqFLXvHbnEJvKyizckPSQvu04/viewform",
  },
  {
    slug: "materials-2",
    subject: "materials",
    title: "Materials of Decoration Part 2",
    number: 7,
    formUrl: "https://docs.google.com/forms/d/1XnJCyKhe-ve0rNNU5o2EsxB67p1uaGHU_MB81WNL99E/viewform",
  },
  {
    slug: "construction-1",
    subject: "construction",
    title: "Building Construction and Utilities Part 1",
    number: 8,
    formUrl: "https://docs.google.com/forms/d/1s8RL797bclELZoq4bjNjUq2cdkhCleCyHkaf7YqqBxI/viewform",
  },
  {
    slug: "construction-2",
    subject: "construction",
    title: "Building Construction and Utilities Part 2",
    number: 9,
    formUrl: "https://docs.google.com/forms/d/1m7vHnmBMpGDAFRa3J0YOdx5jzR5oV82Qy91Sri3MfMQ/viewform",
  },
  {
    slug: "furniture",
    subject: "furniture",
    title: "Furniture Design and Construction",
    number: 10,
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSelwr16rhYGzaPORpcmms86JQlToKhpJkF_KgJYWwLwQ9NBiQ/viewform",
  },
  {
    slug: "professional-practice",
    subject: "practice",
    title: "Professional Practice and Ethics",
    number: 11,
    formUrl: "https://docs.google.com/forms/d/1TzlikU0DQ-77RXhNHXCZcTQ-7ltHfJeaF6N105CSFZs/viewform",
  },
  {
    slug: "color-theory",
    subject: "color",
    title: "Color Theory",
    number: 12,
    formUrl: "https://docs.google.com/forms/d/1YY8ogFx66hlRFMpu2OB6SvclMZPIg5FAbwel8QL94LI/viewform",
  },
];

/** Sets shown to members (the example set only appears on your computer). */
export const SETS: SetInfo[] = ALL_SETS.filter(
  (set) => !set.devOnly || process.env.NODE_ENV === "development",
);

export function findSet(slug: string): SetInfo | undefined {
  return SETS.find((set) => set.slug === slug);
}

export function subjectOf(set: SetInfo): Subject {
  return SUBJECTS.find((subject) => subject.id === set.subject) ?? SUBJECTS[0];
}

/** "Set 07", or the subject name for unnumbered sets. */
export function setLabel(set: SetInfo): string {
  return set.number ? `Set ${String(set.number).padStart(2, "0")}` : subjectOf(set).short;
}
