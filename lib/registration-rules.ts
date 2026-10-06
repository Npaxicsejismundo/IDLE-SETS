// Validation shared by the registration form (browser) and the server.

export const MAX_PROOF_BYTES = 10 * 1024 * 1024; // 10 MB, same as the old Google Form

export const PROOF_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

export type RegistrationDetails = {
  email: string;
  fullName: string;
  school: string;
  agreedNoRefund: boolean;
  agreedTerms: boolean;
};

export type DetailField = keyof RegistrationDetails;
export type FieldErrors = Partial<Record<DetailField | "proof", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeDetails(input: RegistrationDetails): RegistrationDetails {
  return {
    email: String(input.email ?? "").trim().toLowerCase(),
    fullName: String(input.fullName ?? "").trim().replace(/\s+/g, " "),
    school: String(input.school ?? "").trim().replace(/\s+/g, " "),
    agreedNoRefund: input.agreedNoRefund === true,
    agreedTerms: input.agreedTerms === true,
  };
}

export function validateDetails(input: RegistrationDetails): FieldErrors {
  const d = normalizeDetails(input);
  const errors: FieldErrors = {};
  if (!d.email) errors.email = "Enter your email address.";
  else if (d.email.length > 254 || !EMAIL_PATTERN.test(d.email))
    errors.email = "Enter a valid email address, like name@gmail.com.";
  if (d.fullName.length < 2) errors.fullName = "Enter your full name.";
  else if (d.fullName.length > 120) errors.fullName = "Keep your name under 120 characters.";
  if (d.school.length < 2) errors.school = "Enter the school you attended.";
  else if (d.school.length > 200) errors.school = "Keep this under 200 characters.";
  if (!d.agreedNoRefund) errors.agreedNoRefund = "Please agree to the no-refund policy.";
  if (!d.agreedTerms) errors.agreedTerms = "Please agree to the membership terms.";
  return errors;
}

const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

/** Some browsers report no type for HEIC photos, so fall back to the extension. */
export function proofContentType(file: { name: string; type: string }): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[ext] ?? "";
}

export function validateProofFile(
  file: { name: string; size: number; type: string } | null,
): string | undefined {
  if (!file) return "Upload a screenshot or PDF of your payment.";
  if (!PROOF_CONTENT_TYPES.includes(proofContentType(file)))
    return "Upload an image (JPG, PNG, WebP, HEIC) or a PDF.";
  if (file.size > MAX_PROOF_BYTES) return "That file is over 10 MB. Try a smaller screenshot.";
  if (file.size === 0) return "That file is empty. Try another one.";
  return undefined;
}
