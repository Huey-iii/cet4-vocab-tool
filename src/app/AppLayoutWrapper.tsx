"use client";

import { usePathname } from "next/navigation";
import AppLayout from "@/components/AppLayout";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Auth and dictionary pages don't need sidebar
  if (pathname.startsWith("/auth") || pathname.startsWith("/dictionary")) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
