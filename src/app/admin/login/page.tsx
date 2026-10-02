import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log masuk admin",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-5">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted">
            ADMIN
          </p>
          <h1 className="font-display text-3xl font-semibold">Log masuk</h1>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger"
          >
            {error}
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
