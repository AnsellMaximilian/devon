import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev On! — Ship it or quit",
  description: "A tactical developer card battler",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
