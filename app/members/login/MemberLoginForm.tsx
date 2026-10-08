"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "../actions";

const input =
  "h-[52px] w-full rounded-2xl border-[1.5px] bg-white px-4 text-[17px] outline-none focus-visible:border-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rust";

export function MemberLoginForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {
    email: defaultEmail,
  });
  const invalid = state.error ? true : undefined;
  const border = state.error ? "border-rust" : "border-line-strong";
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="member-email" className="text-[15px] font-bold">
          Email
        </label>
        <input
          id="member-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          aria-invalid={invalid}
          aria-describedby={state.error ? "member-login-error" : undefined}
          className={`${input} ${border}`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="member-code" className="text-[15px] font-bold">
          Access code
        </label>
        <input
          id="member-code"
          name="code"
          type="text"
          required
          autoComplete="one-time-code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={state.code}
          placeholder="e.g. K7M3-Q9TX"
          aria-invalid={invalid}
          aria-describedby={state.error ? "member-login-error" : undefined}
          className={`${input} ${border} font-bold tracking-[0.12em] uppercase placeholder:font-normal placeholder:tracking-normal placeholder:normal-case placeholder:text-dim`}
        />
      </div>
      {state.error && (
        <p id="member-login-error" role="alert" className="text-[14px] font-semibold text-rust">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-[52px] cursor-pointer items-center justify-center rounded-full bg-ink text-[16px] font-bold text-white hover:bg-coal disabled:cursor-wait disabled:bg-coal"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
