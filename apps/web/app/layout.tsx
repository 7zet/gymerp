import type { ReactNode } from "react";

export const metadata = { title: "Sport ERP" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
