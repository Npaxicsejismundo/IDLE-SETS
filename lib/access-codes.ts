import "server-only";
import { randomInt } from "node:crypto";

// Personal access codes, e.g. "K7M3-Q9TX". Made when you grant access in
// /admin. Letters and digits that are easy to mix up (0/O, 1/I/L) are left out.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LENGTH = 8;

export function newAccessCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** What the member typed → the stored form (no dash, spaces or lowercase). */
export function normalizeAccessCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32);
}

/** Stored form → how it's shown: "K7M3-Q9TX". */
export function formatAccessCode(code: string): string {
  return code.length === LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}
