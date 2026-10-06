"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label htmlFor="admin-password" className="text-[15px] font-bold">
        Admin password
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "admin-password-error" : undefined}
        className={`h-[52px] w-full rounded-2xl border-[1.5px] bg-white px-4 text-[17px] outline-none focus-visible:border-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rust ${
          state.error ? "border-rust" : "border-line-strong"
        }`}
      />
      {state.error && (
        <p id="admin-password-error" className="text-[14px] font-semibold text-rust">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-[52px] cursor-pointer items-center justify-center rounded-full bg-ink text-[16px] font-bold text-white hover:bg-coal disabled:cursor-wait disabled:bg-coal"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
