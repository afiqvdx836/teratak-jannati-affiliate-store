"use client";

import { useState, useActionState } from "react";
import { login, requestMagicLink } from "../actions";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [magicState, magicAction, magicPending] = useActionState(
    requestMagicLink,
    undefined,
  );
  const [pwState, pwAction, pwPending] = useActionState(login, undefined);

  const sent = magicState?.error === "sent";

  return (
    <div className="flex flex-col gap-5">
      {/* Magic Link */}
      {sent ? (
        <div className="rounded-xl bg-ok-bg px-4 py-4 text-sm">
          <p className="font-bold text-ok">Email dihantar!</p>
          <p className="mt-1 text-ok">
            Semak inbox anda dan klik link untuk log masuk. Link sah 15 minit.
          </p>
        </div>
      ) : (
        <form action={magicAction} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-bold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="anda@contoh.com"
            className="h-12 rounded-xl border border-line-strong bg-white px-3.5 text-[15px]"
          />
          {magicState?.error && magicState.error !== "sent" && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {magicState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={magicPending}
            className="h-12 rounded-xl bg-ink font-bold text-white disabled:opacity-60"
          >
            {magicPending ? "Menghantar…" : "Hantar Magic Link"}
          </button>
        </form>
      )}

      {/* Password fallback */}
      <div className="border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="text-sm font-semibold text-muted hover:text-ink"
        >
          {showPassword ? "Tutup" : "Log masuk dengan password"}
        </button>
        {showPassword && (
          <form action={pwAction} className="mt-3 flex flex-col gap-3">
            <label htmlFor="password" className="text-sm font-bold">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-12 rounded-xl border border-line-strong bg-white px-3.5 text-[15px]"
            />
            {pwState?.error && (
              <p role="alert" className="text-sm font-semibold text-danger">
                {pwState.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pwPending}
              className="h-12 rounded-xl bg-ink font-bold text-white disabled:opacity-60"
            >
              {pwPending ? "Sekejap…" : "Masuk"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
