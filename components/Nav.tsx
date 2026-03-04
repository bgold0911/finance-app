import Link from "next/link";

export default function Nav() {
  return (
    <nav className="bg-[#664930] border-b border-[#4d3520]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-white font-bold text-xl">◆</span>
            <span className="text-white font-bold text-lg tracking-tight">Brandon's Finance Guide</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/tools/monte-carlo" className="text-sm text-[#CCBEB1] hover:text-white transition-colors">
              Retirement
            </Link>
            <Link href="/" className="text-sm text-[#997E67] cursor-not-allowed">
              Budgeting
            </Link>
            <Link href="/" className="text-sm text-[#997E67] cursor-not-allowed">
              Debt
            </Link>
            <Link href="/" className="text-sm text-[#997E67] cursor-not-allowed">
              Investing
            </Link>
          </div>
          <Link
            href="/tools/monte-carlo"
            className="bg-white text-[#664930] font-semibold text-sm px-4 py-2 rounded-md hover:bg-[#FFDBBB] transition-colors"
          >
            Try a Tool →
          </Link>
        </div>
      </div>
    </nav>
  );
}
