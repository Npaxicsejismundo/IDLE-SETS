import "server-only";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { SETS } from "./sets";

// Loads a set's questions from content/sets/<slug>.csv (a spreadsheet saved
// as CSV). Columns, in any order, with a header row:
//   question | a | b | c | d | (e) | (f) | answer | explanation
// "answer" is the letter of the right choice. See content/sets/README.md.

export type Choice = { id: string; text: string };

export type Question = {
  /** Stable id for saved progress: a hash of the question text. */
  key: string;
  /** Position in the set, from 1. */
  number: number;
  text: string;
  choices: Choice[];
  /** id of the right choice ("a", "b", …). */
  answer: string;
  explanation: string;
};

export type LoadedSet = {
  slug: string;
  questions: Question[];
  /** Rows that were skipped, and why. Shown on the Sets page during development. */
  problems: string[];
};

const DIR = path.join(process.cwd(), "content", "sets");
const LETTERS = ["a", "b", "c", "d", "e", "f"];

/** Minimal CSV/TSV parser: quoted fields, "" escapes, newlines inside quotes. */
function parseDelimited(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const delimiter = firstLine.includes("\t")
    ? "\t"
    : !firstLine.includes(",") && firstLine.includes(";")
      ? ";"
      : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Like clean(), but keeps line breaks (for explanations). */
function cleanLines(value: string | undefined): string {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Maps header names people are likely to use onto our columns. */
function columnFor(header: string): string | null {
  const h = header.toLowerCase().replace(/[^a-z]/g, "");
  if (["question", "questions", "item", "q"].includes(h)) return "question";
  if (["answer", "correct", "correctanswer", "key", "answerkey"].includes(h)) return "answer";
  if (["explanation", "why", "rationale", "reason", "notes", "note"].includes(h)) {
    return "explanation";
  }
  const letter = h.replace(/^(choice|option|opt)/, "");
  if (LETTERS.includes(letter)) return letter;
  return null;
}

function keyFor(text: string): string {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 12);
}

function parseSet(slug: string, csv: string): LoadedSet {
  const rows = parseDelimited(csv);
  const problems: string[] = [];
  const questions: Question[] = [];
  if (rows.length === 0) return { slug, questions, problems: ["The file is empty."] };

  const columns = new Map<string, number>();
  rows[0].forEach((header, index) => {
    const column = columnFor(header);
    if (column && !columns.has(column)) columns.set(column, index);
  });
  for (const required of ["question", "a", "b", "answer"]) {
    if (!columns.has(required)) {
      problems.push(`The first row needs a "${required}" column.`);
    }
  }
  if (problems.length) return { slug, questions, problems };

  const seen = new Map<string, number>();
  rows.slice(1).forEach((row, i) => {
    const line = i + 2; // spreadsheet row number
    const raw = (column: string) => {
      const index = columns.get(column);
      return index === undefined ? "" : row[index];
    };
    const get = (column: string) => clean(raw(column));
    const text = get("question");
    if (!text) {
      problems.push(`Row ${line}: no question.`);
      return;
    }
    const choices: Choice[] = [];
    for (const id of LETTERS) {
      const choiceText = get(id);
      if (choiceText) choices.push({ id, text: choiceText });
    }
    if (choices.length < 2) {
      problems.push(`Row ${line}: needs at least two choices.`);
      return;
    }
    const rawAnswer = get("answer");
    if (!rawAnswer) {
      problems.push(`Row ${line}: no answer.`);
      return;
    }
    const byLetter = rawAnswer.toLowerCase().replace(/[^a-z]/g, "");
    const answer =
      choices.find((c) => c.id === byLetter)?.id ??
      choices.find((c) => c.text.toLowerCase() === rawAnswer.toLowerCase())?.id;
    if (!answer) {
      problems.push(
        `Row ${line}: the answer "${rawAnswer}" isn't one of the choices (use the letter, e.g. C).`,
      );
      return;
    }
    let key = keyFor(text);
    const repeat = (seen.get(key) ?? 0) + 1;
    seen.set(key, repeat);
    if (repeat > 1) key = `${key}-${repeat}`;
    questions.push({
      key,
      number: questions.length + 1,
      text,
      choices,
      answer,
      explanation: cleanLines(raw("explanation")),
    });
  });
  return { slug, questions, problems };
}

const parsed = new Map<string, { mtimeMs: number; set: LoadedSet }>();

/** The set's questions, or null if it has no CSV (it opens its Google Form). */
export async function loadSet(slug: string): Promise<LoadedSet | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(DIR, `${slug}.csv`);
  let mtimeMs: number;
  try {
    mtimeMs = (await stat(file)).mtimeMs;
  } catch {
    return null;
  }
  const hit = parsed.get(slug);
  if (hit && hit.mtimeMs === mtimeMs) return hit.set;
  const set = parseSet(slug, await readFile(file, "utf8"));
  if (set.problems.length) {
    console.warn(`[sets] content/sets/${slug}.csv:\n  ${set.problems.join("\n  ")}`);
  }
  parsed.set(slug, { mtimeMs, set });
  return set;
}

/**
 * Every listed set that has a CSV, by slug. A set is answered in the site when
 * it's here with at least one question (see playable()).
 */
export const loadAllSets = cache(async (): Promise<Map<string, LoadedSet>> => {
  let files: string[] = [];
  try {
    files = await readdir(DIR);
  } catch {
    // No content/sets folder: every set uses its Google Form.
  }
  const result = new Map<string, LoadedSet>();
  await Promise.all(
    SETS.filter((set) => files.includes(`${set.slug}.csv`)).map(async (set) => {
      const loaded = await loadSet(set.slug);
      if (loaded) result.set(set.slug, loaded);
    }),
  );
  return result;
});

export function playable(loaded: LoadedSet | undefined | null): loaded is LoadedSet {
  return Boolean(loaded && loaded.questions.length > 0);
}
