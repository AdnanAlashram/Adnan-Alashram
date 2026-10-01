import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ADMIN_ENABLED } from "@/lib/features";

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (!ADMIN_ENABLED) notFound();

  return children;
}