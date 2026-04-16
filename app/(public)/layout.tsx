"use client";

import ThemeProvider from "@/components/layout/ThemeProvider";
import PublicLayout from "@/components/layout/PublicLayout";

export default function PublicRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <PublicLayout>{children}</PublicLayout>
    </ThemeProvider>
  );
}
