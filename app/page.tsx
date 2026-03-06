import Link from "next/link";
import MarketNews from "@/components/MarketNews";

export const dynamic = "force-dynamic";

const TOOLS = [
  {
    href: "/tools/monte-carlo",
    icon: "📊",
    title: "Monte Carlo Simulator",
    description:
      "Run 1,000 retirement simulations using historical market data. Get a probability-of-success score and see the range of possible futures.",
    stat: "e.g. 78% success rate on a $100K portfolio at 30",
    tag: "LIVE",
    tagColor: "bg-[#FFDBBB] text-[#664930]",
  },
  {
    href: "/tools/debt-payoff",
    icon: "💳",
    title: "Debt Payoff Planner",
    description:
      "Compare the Avalanche vs. Snowball strategies side-by-side. Find out exactly when you'll be debt-free and how much interest you'll save.",
    stat: "e.g. Save $4,100 with Avalanche vs. minimums only",
    tag: "LIVE",
    tagColor: "bg-[#FFDBBB] text-[#664930]",
  },
  {
    href: "/tools/coast-fire",
    icon: "🔥",
    title: "Coast FIRE Calculator",
    description:
      "Find the portfolio size where you can stop contributing and let compound growth carry you to retirement. See how close you are.",
    stat: "e.g. Coast FIRE at age 42 with $210K saved",
    tag: "LIVE",
    tagColor: "bg-[#FFDBBB] text-[#664930]",
  },
  {
    href: "/tools/rent-vs-buy",
    icon: "🏠",
    title: "Rent vs. Buy",
    description:
      "Compare the true 30-year cost of renting vs. buying a home. Includes opportunity cost, taxes, appreciation, and equity build-up.",
    stat: "e.g. Break-even in year 7 on a $500K home",
    tag: "LIVE",
    tagColor: "bg-[#FFDBBB] text-[#664930]",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#664930] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-[#CCBEB1] text-sm font-bold uppercase tracking-widest mb-4">
            Brandon&apos;s Finance Guide
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Run the math on your
            <br />
            <span className="text-[#FFDBBB] underline decoration-[#CCBEB1]/50 underline-offset-4">biggest financial decisions.</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
            Free calculators built on real data and honest math — not guesses.
            Retirement, debt, home buying, and financial independence, all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#tools"
              className="inline-block bg-white text-[#664930] font-bold text-base px-8 py-4 rounded-lg hover:bg-[#FFDBBB] transition-colors"
            >
              Explore the tools ↓
            </a>
            <Link
              href="/tools/monte-carlo"
              className="inline-block border border-white/40 text-white font-semibold text-base px-8 py-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              Monte Carlo Simulator →
            </Link>
          </div>
        </div>
        <div className="h-1 bg-white/20" />
      </section>

      {/* Question prompts */}
      <section className="bg-[#4d3520]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { q: "Will my money last through retirement?",       tool: "Monte Carlo Simulator",  href: "/tools/monte-carlo" },
            { q: "Can I stop saving and still retire on track?", tool: "Coast FIRE Calculator",  href: "/tools/coast-fire" },
            { q: "Which debt should I pay off first?",           tool: "Debt Payoff Planner",    href: "/tools/debt-payoff" },
            { q: "Is it smarter to buy a home or keep renting?", tool: "Rent vs. Buy Calculator", href: "/tools/rent-vs-buy" },
          ].map(({ q, tool, href }) => (
            <Link
              key={href} href={href}
              className="flex items-center justify-between gap-4 bg-white/5 hover:bg-white/10 transition-colors rounded-lg px-4 py-3 group"
            >
              <div>
                <p className="text-sm font-medium text-white">{q}</p>
                <p className="text-xs text-[#FFDBBB] mt-0.5">{tool} →</p>
              </div>
              <span className="text-[#CCBEB1] group-hover:text-white transition-colors text-lg shrink-0">›</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          {["No account required", "No data collected", "No ads", "100% free"].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span className="text-green-500 font-bold">✓</span>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Market news */}
      <MarketNews />

      {/* Tools grid */}
      <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-[#664930] mb-2">All Tools</h2>
        <p className="text-gray-500 mb-10">
          Interactive calculators — results update as you type, no account needed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {TOOLS.map((tool) => (
            <div
              key={tool.title}
              className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-[#997E67] transition-all"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{tool.icon}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${tool.tagColor}`}>
                  {tool.tag}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[#664930] text-lg mb-1">{tool.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{tool.description}</p>
              </div>
              <div className="bg-[#FAF6F2] rounded-lg px-3 py-2">
                <p className="text-xs text-[#664930] font-medium">{tool.stat}</p>
              </div>
              <Link
                href={tool.href}
                className="mt-auto inline-block text-center bg-[#664930] text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-[#4d3520] transition-colors"
              >
                Open Tool →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <p className="text-xs text-gray-400 text-center">
          All tools are for educational purposes only and do not constitute financial advice.
          Past market returns do not guarantee future results.
        </p>
      </section>
    </>
  );
}
