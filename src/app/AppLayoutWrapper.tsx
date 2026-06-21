"use client";

import SimpleLayout from "@/components/SimpleLayout";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SimpleLayout>{children}</SimpleLayout>;
}
