import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Brandon's Finance Guide — Personal Finance Tools",
  description: "Free tools for budgeting, retirement planning, debt payoff, and investing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#006039] text-white/60 text-sm text-center py-6 mt-16">
          <p>Brandon's Finance Guide · Educational tools only · Not financial advice</p>
        </footer>
      </body>
    </html>
  );
}
