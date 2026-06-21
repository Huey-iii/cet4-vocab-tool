"use client";

import { usePathname } from "next/navigation";
import AppLayout from "@/components/AppLayout";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // All pages skip AppLayout until MemFireCloud is ready
  return <>{children}</>;

  return <AppLayout>{children}</AppLayout>;
}
