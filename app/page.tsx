import Link from "next/link";

const TOOLS = [
  {
    href: "/tools/monte-carlo",
    icon: "📊",
    title: "Monte Carlo Simulator",
    description:
      "Run 1,000 retirement simulations using historical market data. Get a probability-of-success score and see the range of possible futures.",
    tag: "LIVE",
    tagColor: "bg-green-100 text-green-700",
    available: true,
  },
  {
    href: "#",
    icon: "📋",
    title: "Budget Calculator",
    description:
      "Break down your income into needs, wants, and savings using the 50/30/20 rule. Get a visual breakdown and personalized targets.",
    tag: "COMING SOON",
    tagColor: "bg-gray-100 text-gray-500",
    available: false,
  },
  {
    href: "#",
    icon: "📈",
    title: "Compound Interest",
    description:
      "See how your investments grow over time. Adjust contribution, rate, and timeline with live-updating charts.",
    tag: "COMING SOON",
    tagColor: "bg-gray-100 text-gray-500",
    available: false,
  },
  {
    href: "#",
    icon: "💳",
    title: "Debt Payoff Planner",
    description:
      "Compare the Avalanche vs. Snowball strategies side-by-side. Find out exactly when you'll be debt-free and how much interest you'll save.",
    tag: "COMING SOON",
    tagColor: "bg-gray-100 text-gray-500",
    available: false,
  },
  {
    href: "#",
    icon: "🔥",
    title: "FIRE Calculator",
    description:
      "Calculate your Financial Independence number and retirement age based on your savings rate and spending.",
    tag: "COMING SOON",
    tagColor: "bg-gray-100 text-gray-500",
    available: false,
  },
  {
    href: "#",
    icon: "🏠",
    title: "Rent vs. Buy",
    description:
      "Compare the true 10-year cost of renting vs. buying a home. Includes opportunity cost, taxes, and equity build-up.",
    tag: "COMING SOON",
    tagColor: "bg-gray-100 text-gray-500",
    available: false,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#006039] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-4">
            Brandon's Finance Guide
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Your Financial Future,
            <br />
            <span className="text-white underline decoration-white/30 underline-offset-4">Simulated.</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
            Free calculators that use real data and math — not guesses. Built to help
            you make better decisions about retirement, budgeting, debt, and investing.
          </p>
          <Link
            href="/tools/monte-carlo"
            className="inline-block bg-white text-[#006039] font-bold text-base px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Try the Monte Carlo Simulator →
          </Link>
        </div>
        <div className="h-1 bg-white/20" />
      </section>

      {/* Stats bar */}
      <section className="bg-[#004d2e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">1,000</p>
            <p className="text-sm text-white/60 mt-1">Simulations per run</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">97 years</p>
            <p className="text-sm text-white/60 mt-1">Of historical return data</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">100% free</p>
            <p className="text-sm text-white/60 mt-1">No account required</p>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-[#006039] mb-2">All Tools</h2>
        <p className="text-gray-500 mb-10">
          Interactive calculators — results update as you type, no account needed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => (
            <div
              key={tool.title}
              className={`bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 shadow-sm transition-shadow ${
                tool.available ? "hover:shadow-md hover:border-[#006039]" : "opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{tool.icon}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${tool.tagColor}`}>
                  {tool.tag}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[#006039] text-lg mb-1">{tool.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{tool.description}</p>
              </div>
              {tool.available ? (
                <Link
                  href={tool.href}
                  className="mt-auto inline-block text-center bg-[#006039] text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-[#004d2e] transition-colors"
                >
                  Open Tool →
                </Link>
              ) : (
                <div className="mt-auto text-center bg-gray-100 text-gray-400 font-semibold text-sm px-4 py-2.5 rounded-lg cursor-not-allowed">
                  Coming Soon
                </div>
              )}
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
