"use client";

import { usePathname } from "next/navigation";
import AppLayout from "@/components/AppLayout";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Auth page doesn't need sidebar
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
