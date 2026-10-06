"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { submitRegistration } from "@/app/subscribe/actions";
import {
  MEMBERSHIP_PRICE,
  membershipTerms,
  membershipTermsClosing,
  noRefundPolicy,
  payment,
} from "@/lib/content";
import {
  PROOF_CONTENT_TYPES,
  proofContentType,
  validateDetails,
  validateProofFile,
  type FieldErrors,
  type RegistrationDetails,
} from "@/lib/registration-rules";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DownloadIcon,
  FileIcon,
  UploadIcon,
} from "./icons";

type Phase = "idle" | "uploading" | "saving" | "done";

const FIELD_ORDER = ["email", "fullName", "school", "proof", "agreedNoRefund", "agreedTerms"] as const;

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** proofs/<safe-name>.<ext>; Blob adds a random suffix so names never clash. */
function blobPathFor(file: File): string {
  const dot = file.name.lastIndexOf(".");
  const ext = (dot > 0 ? file.name.slice(dot + 1) : "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = (dot > 0 ? file.name.slice(0, dot) : file.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `proofs/${base || "proof"}${ext ? `.${ext.slice(0, 5)}` : ""}`;
}

export function RegistrationForm() {
  const [details, setDetails] = useState<RegistrationDetails>({
    email: "",
    fullName: "",
    school: "",
    agreedNoRefund: false,
    agreedTerms: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ email: string; confirmationEmail: boolean } | null>(null);
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const busy = phase === "uploading" || phase === "saving";

  function update<K extends keyof RegistrationDetails>(key: K, value: RegistrationDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function chooseFile(next: File | null) {
    setFile(next);
    setErrors((e) => ({ ...e, proof: next ? validateProofFile(next) : undefined }));
  }

  function focusFirstError(found: FieldErrors) {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFormError(null);

    const found: FieldErrors = { ...validateDetails(details) };
    const fileError = validateProofFile(file);
    if (fileError) found.proof = fileError;
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }

    try {
      // Reuse an earlier upload of the same file if the save step failed before.
      let proofUrl = uploaded.current?.file === file ? uploaded.current.url : null;
      if (!proofUrl && file) {
        setPhase("uploading");
        setProgress(0);
        const blob = await upload(blobPathFor(file), file, {
          access: "private",
          handleUploadUrl: "/api/proof-upload",
          contentType: proofContentType(file),
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        proofUrl = blob.url;
        uploaded.current = { file, url: blob.url };
      }

      setPhase("saving");
      const response = await submitRegistration({
        ...details,
        proofUrl: proofUrl ?? "",
        website: honeypot.current?.value ?? "",
      });

      if (response.ok) {
        setResult({ email: response.email, confirmationEmail: response.confirmationEmail });
        setPhase("done");
        formRef.current?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (response.fieldErrors?.proof) uploaded.current = null;
      setErrors(response.fieldErrors ?? {});
      setFormError(response.formError ?? null);
      if (response.fieldErrors) focusFirstError(response.fieldErrors);
      setPhase("idle");
    } catch (error) {
      console.error(error);
      setFormError(
        "We couldn't upload your proof of payment. Check your connection and try again.",
      );
      setPhase("idle");
    }
  }

  if (phase === "done" && result) {
    return <Success email={result.email} confirmationEmail={result.confirmationEmail} />;
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col">
      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <FormSection number={1} title="Your details">
        <TextField
          field="email"
          label="Email"
          type="email"
          autoComplete="email"
          hint="Use your personal email. Your access will be given to this address."
          value={details.email}
          error={errors.email}
          onChange={(v) => update("email", v)}
        />
        <TextField
          field="fullName"
          label="Full name"
          autoComplete="name"
          value={details.fullName}
          error={errors.fullName}
          onChange={(v) => update("fullName", v)}
        />
        <TextField
          field="school"
          label="School attended"
          autoComplete="organization"
          value={details.school}
          error={errors.school}
          onChange={(v) => update("school", v)}
        />
      </FormSection>

      <FormSection number={2} title={`Pay ${MEMBERSHIP_PRICE}`}>
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-sand p-5">
          <Image
            src={payment.qrSrc}
            alt={payment.qrAlt}
            width={payment.qrWidth}
            height={payment.qrHeight}
            unoptimized
            className="h-auto w-full max-w-[340px] rounded-xl"
          />
          <div className="flex w-full flex-col gap-3 text-[15px] text-body">
            <p>
              Send <strong className="text-ink">{MEMBERSHIP_PRICE}</strong> using this InstaPay
              QR code in your bank or e-wallet app.
            </p>
            <p>
              On your phone? Save the QR image, then upload it from your gallery in your
              app&apos;s &ldquo;Scan QR&rdquo; screen.
            </p>
            <p className="text-[14px] text-muted">Transfer fees may apply. Keep a screenshot of your receipt for the next step.</p>
            <a
              href={payment.qrSrc}
              download="idle-sets-payment-qr.png"
              className="inline-flex h-11 items-center gap-2 self-start rounded-full border-[1.5px] border-ink bg-paper px-4 text-[15px] font-bold hover:bg-white"
            >
              <DownloadIcon size={18} />
              Save QR image
            </a>
          </div>
        </div>
      </FormSection>

      <FormSection number={3} title="Upload your proof of payment">
        <FileField file={file} error={errors.proof} disabled={busy} onChange={chooseFile} />
      </FormSection>

      <FormSection number={4} title="Agree to the terms" last>
        <CheckboxField
          field="agreedNoRefund"
          checked={details.agreedNoRefund}
          error={errors.agreedNoRefund}
          onChange={(v) => update("agreedNoRefund", v)}
        >
          {noRefundPolicy}
        </CheckboxField>

        <div
          tabIndex={0}
          role="region"
          aria-label="Membership Terms & Guidelines"
          className="max-h-72 overflow-y-auto rounded-2xl border-[1.5px] border-line-strong bg-white px-5 py-4 text-[15px] leading-[1.55] text-body"
        >
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-rust">
            Membership Terms &amp; Guidelines
          </p>
          {membershipTerms.map((section) => (
            <div key={section.heading} className="mb-4">
              <p className="mb-1.5 font-bold text-ink underline underline-offset-2">{section.heading}</p>
              {section.paragraphs.map((p) => (
                <p key={p} className="mb-2">
                  {p}
                </p>
              ))}
            </div>
          ))}
          <p className="font-bold text-ink">{membershipTermsClosing}</p>
        </div>

        <CheckboxField
          field="agreedTerms"
          checked={details.agreedTerms}
          error={errors.agreedTerms}
          onChange={(v) => update("agreedTerms", v)}
        >
          I have read and agree to the Membership Terms &amp; Guidelines.
        </CheckboxField>
      </FormSection>

      <div className="flex flex-col gap-3 px-5 pt-2 pb-6 sm:px-7 sm:pb-8">
        <div aria-live="polite">
          {formError && (
            <p className="flex items-start gap-2.5 rounded-2xl border-[1.5px] border-rust bg-white px-4 py-3 text-[15px] text-ink">
              <AlertIcon size={20} className="mt-0.5 flex-none text-rust" />
              <span>
                {formError}{" "}
                <a href={INSTAGRAM_URL} className="font-semibold underline underline-offset-2">
                  Need help? DM {INSTAGRAM_HANDLE}
                </a>
              </span>
            </p>
          )}
          {Object.values(errors).some(Boolean) && !formError && (
            <p className="text-[15px] font-semibold text-rust">
              Please fix the highlighted fields above.
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex h-[60px] w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-ink text-[18px] font-bold text-white hover:bg-coal disabled:cursor-wait disabled:bg-coal"
        >
          {phase === "uploading"
            ? `Uploading proof… ${progress}%`
            : phase === "saving"
              ? "Submitting…"
              : (
                <>
                  Submit registration
                  <ArrowRightIcon size={22} />
                </>
              )}
        </button>
        <p className="text-center text-[13px] text-muted">
          We only use your details to process your membership.
        </p>
      </div>
    </form>
  );
}

function FormSection({
  number,
  title,
  last = false,
  children,
}: {
  number: number;
  title: string;
  last?: boolean;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={`flex flex-col gap-4 px-5 py-6 sm:px-7 ${last ? "" : "border-b-[1.5px] border-line-soft"}`}
    >
      <h3 id={headingId} className="flex items-center gap-3 text-[20px] leading-[1.2] font-extrabold">
        <span
          aria-hidden="true"
          className="flex size-8 flex-none items-center justify-center rounded-full border-[1.5px] border-ink bg-orange font-display text-[16px] font-normal"
        >
          {number}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-[14px] font-semibold text-rust">
      <AlertIcon size={16} className="flex-none" />
      {message}
    </p>
  );
}

function TextField({
  field,
  label,
  hint,
  type = "text",
  autoComplete,
  value,
  error,
  onChange,
}: {
  field: string;
  label: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-bold">
        {label} <span className="text-rust" aria-hidden="true">*</span>
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-0.5 text-[14px] text-muted">
          {hint}
        </p>
      )}
      <input
        id={id}
        data-field={field}
        name={field}
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`h-[52px] w-full rounded-2xl border-[1.5px] bg-white px-4 text-[17px] text-ink outline-none placeholder:text-dim focus-visible:border-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rust ${
          error ? "border-rust" : "border-line-strong hover:border-stone"
        }`}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function CheckboxField({
  field,
  checked,
  error,
  onChange,
  children,
}: {
  field: string;
  checked: boolean;
  error?: string;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] bg-white px-4 py-3.5 text-[15px] leading-[1.5] text-body ${
          error ? "border-rust" : checked ? "border-ink" : "border-line-strong hover:border-stone"
        }`}
      >
        <input
          id={id}
          data-field={field}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 flex-none cursor-pointer accent-ink"
        />
        <span>
          {children} <span className="text-rust" aria-hidden="true">*</span>
        </span>
      </label>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FileField({
  file,
  error,
  disabled,
  onChange,
}: {
  file: File | null;
  error?: string;
  disabled: boolean;
  onChange: (file: File | null) => void;
}) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) onChange(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex cursor-pointer items-center gap-4 rounded-2xl border-[1.5px] border-dashed px-5 py-5 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-rust ${
          error
            ? "border-rust bg-white"
            : dragging
              ? "border-ink bg-sand"
              : file
                ? "border-ink bg-white"
                : "border-stone bg-white hover:border-ink"
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex size-12 flex-none items-center justify-center rounded-full border-[1.5px] border-ink ${file ? "bg-orange" : "bg-cream"}`}
        >
          {file ? <FileIcon size={22} /> : <UploadIcon size={22} />}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          {file ? (
            <>
              <span className="truncate text-[16px] font-bold">{file.name}</span>
              <span className="text-[14px] text-muted">
                {formatSize(file.size)} · <span className="font-semibold text-ink underline underline-offset-2">Change file</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-[16px] font-bold">
                Choose a file <span className="text-rust" aria-hidden="true">*</span>
              </span>
              <span className="text-[14px] text-muted">Screenshot or PDF of your receipt, up to 10 MB</span>
            </>
          )}
        </span>
        <input
          id={id}
          data-field="proof"
          type="file"
          accept={[...PROOF_CONTENT_TYPES, ".heic", ".heif"].join(",")}
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-label="Proof of payment (image or PDF, up to 10 MB)"
          className="sr-only"
        />
      </label>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function Success({ email, confirmationEmail }: { email: string; confirmationEmail: boolean }) {
  return (
    <div className="flex flex-col items-start gap-5 px-5 py-10 sm:px-8 sm:py-14" role="status">
      <span className="flex size-16 items-center justify-center rounded-full border-[1.5px] border-ink bg-orange">
        <CheckCircleIcon size={34} />
      </span>
      <h2 className="font-display text-[clamp(40px,5vw,56px)] leading-[0.95] uppercase">
        Registration received.
      </h2>
      <p className="max-w-[34em] text-[18px] leading-[1.55] text-body">
        Thank you! We&apos;ll check your payment and give{" "}
        <strong className="break-all text-ink">{email}</strong> access to the reviewer sets once
        your registration is processed.
      </p>
      {confirmationEmail && (
        <p className="max-w-[34em] text-[16px] text-body">
          We&apos;ve also sent a confirmation to your inbox. Check your spam folder if you
          don&apos;t see it.
        </p>
      )}
      <p className="text-[15px] text-muted">
        Questions? Message us on Instagram at{" "}
        <a href={INSTAGRAM_URL} className="font-semibold text-ink underline underline-offset-2 hover:text-rust">
          {INSTAGRAM_HANDLE}
        </a>
        .
      </p>
    </div>
  );
}
