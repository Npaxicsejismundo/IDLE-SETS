"use server";

import { head } from "@vercel/blob";
import { after } from "next/server";
import { databaseUrl } from "@/lib/db";
import { registrantEmailEnabled, sendRegistrationEmails } from "@/lib/email";
import {
  MAX_PROOF_BYTES,
  PROOF_CONTENT_TYPES,
  normalizeDetails,
  validateDetails,
  type FieldErrors,
  type RegistrationDetails,
} from "@/lib/registration-rules";
import { createRegistration } from "@/lib/registrations";

export type SubmitResult =
  | { ok: true; email: string; confirmationEmail: boolean }
  | { ok: false; fieldErrors?: FieldErrors; formError?: string };

const UNAVAILABLE =
  "Registration is temporarily unavailable. Please try again later or message us on Instagram.";

/** The proof must be a private file in this site's Blob store, under proofs/. */
function proofUrlLooksValid(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    url.hostname.endsWith(".private.blob.vercel-storage.com") &&
    url.pathname.startsWith("/proofs/")
  );
}

export async function submitRegistration(
  input: RegistrationDetails & { proofUrl: string; website?: string },
): Promise<SubmitResult> {
  const details = normalizeDetails(input);

  // Honeypot: real people never see or fill the "website" field.
  if (input.website) {
    return { ok: true, email: details.email, confirmationEmail: false };
  }

  const fieldErrors = validateDetails(details);
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  if (!databaseUrl() || !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[register] DATABASE_URL or BLOB_READ_WRITE_TOKEN is not set.");
    return { ok: false, formError: UNAVAILABLE };
  }

  const proofUrl = String(input.proofUrl ?? "");
  const proofError = { ok: false as const, fieldErrors: { proof: "Your proof of payment didn't upload. Please choose the file again." } };
  if (!proofUrlLooksValid(proofUrl)) return proofError;

  // Confirms the file exists in our own store and checks its size and type.
  let proof: Awaited<ReturnType<typeof head>>;
  try {
    proof = await head(proofUrl);
  } catch {
    return proofError;
  }
  if (
    proof.size === 0 ||
    proof.size > MAX_PROOF_BYTES ||
    !PROOF_CONTENT_TYPES.includes(proof.contentType)
  ) {
    return proofError;
  }

  try {
    const registration = await createRegistration({
      ...details,
      proofUrl,
      proofPathname: proof.pathname,
      proofContentType: proof.contentType,
      proofSize: proof.size,
    });
    after(() => sendRegistrationEmails(registration));
    return {
      ok: true,
      email: registration.email,
      confirmationEmail: registrantEmailEnabled(),
    };
  } catch (error) {
    console.error("[register] could not save registration:", error);
    return { ok: false, formError: UNAVAILABLE };
  }
}
