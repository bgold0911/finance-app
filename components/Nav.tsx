"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/tools/monte-carlo", label: "Retirement" },
  { href: "/tools/coast-fire",  label: "Coast FIRE" },
  { href: "/tools/debt-payoff", label: "Debt Payoff" },
  { href: "/tools/rent-vs-buy", label: "Rent vs. Buy" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-[#664930] border-b border-[#4d3520] relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="text-white font-bold text-xl">◆</span>
            <span className="text-white font-bold text-lg tracking-tight">Brandon&apos;s Finance Guide</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm text-[#CCBEB1] hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tools/monte-carlo"
              className="hidden sm:inline-block bg-white text-[#664930] font-semibold text-sm px-4 py-2 rounded-md hover:bg-[#FFDBBB] transition-colors"
            >
              Try a Tool →
            </Link>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-[#4d3520] border-t border-[#664930]/50 px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href} href={href}
              onClick={() => setOpen(false)}
              className="text-sm text-[#CCBEB1] hover:text-white py-2.5 border-b border-white/10 last:border-0 transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/tools/monte-carlo"
            onClick={() => setOpen(false)}
            className="mt-2 text-center bg-white text-[#664930] font-semibold text-sm px-4 py-2.5 rounded-md hover:bg-[#FFDBBB] transition-colors"
          >
            Try a Tool →
          </Link>
        </div>
      )}
    </nav>
  );
}
