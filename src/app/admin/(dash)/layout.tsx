import type { Metadata } from "next";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col pb-20">{children}</div>
      <AdminNav />
    </div>
  );
}
