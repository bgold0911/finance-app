// ─────────────────────────────────────────────────────────────────────────────
// AffiliateCTA — contextual affiliate recommendation card
//
// HOW TO ADD YOUR AFFILIATE LINKS:
//   Replace every instance of "YOUR_AFFILIATE_LINK" below with your actual
//   affiliate URL from each partner's affiliate/referral program.
// ─────────────────────────────────────────────────────────────────────────────

export type AffiliateContext = "investing" | "debt" | "mortgage";

interface Partner {
  name: string;
  tagline: string;
  url: string;
  cta: string;
}

const CONTENT: Record<
  AffiliateContext,
  { headline: string; sub: string; partners: Partner[] }
> = {
  investing: {
    headline: "Ready to put your plan into action?",
    sub: "Open a brokerage or investment account to start building the portfolio you just modeled.",
    partners: [
      {
        name: "Betterment",
        tagline: "Automated investing, no minimums",
        url: "YOUR_AFFILIATE_LINK",
        cta: "Open account →",
      },
      {
        name: "M1 Finance",
        tagline: "Invest in custom portfolios, free",
        url: "YOUR_AFFILIATE_LINK",
        cta: "Open account →",
      },
      {
        name: "Fidelity",
        tagline: "Zero-fee index funds, trusted since 1946",
        url: "YOUR_AFFILIATE_LINK",
        cta: "Open account →",
      },
    ],
  },
  debt: {
    headline: "Could a lower interest rate speed up your payoff?",
    sub: "A personal loan can consolidate high-interest debt into one fixed payment — often at a significantly lower rate.",
    partners: [
      {
        name: "SoFi",
        tagline: "Personal loans up to $100K, no fees",
        url: "YOUR_AFFILIATE_LINK",
        cta: "Check your rate →",
      },
      {
        name: "LightStream",
        tagline: "Rates as low as 6.99% APR for good credit",
        url: "YOUR_AFFILIATE_LINK",
        cta: "Check your rate →",
      },
    ],
  },
  mortgage: {
    headline: "Thinking about making the move to buy?",
    sub: "Compare mortgage rates from multiple lenders in minutes — no impact to your credit score.",
    partners: [
      {
        name: "Credible",
        tagline: "Compare rates from top lenders instantly",
        url: "YOUR_AFFILIATE_LINK",
        cta: "Compare rates →",
      },
      {
        name: "Rocket Mortgage",
        tagline: "Apply online in minutes, close fast",
        url: "YOUR_AFFILIATE_LINK",
        cta: "Get pre-approved →",
      },
    ],
  },
};

export default function AffiliateCTA({ context }: { context: AffiliateContext }) {
  const { headline, sub, partners } = CONTENT[context];

  return (
    <div className="rounded-xl border border-[#CCBEB1] bg-[#FAF6F2] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-base font-bold text-[#664930]">{headline}</p>
          <p className="text-xs text-gray-500 mt-0.5 max-w-md">{sub}</p>
        </div>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0 ml-4 mt-0.5">
          Partner
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {partners.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-between gap-3 bg-white border border-[#CCBEB1] rounded-lg px-4 py-3 hover:border-[#664930] hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-sm font-bold text-[#664930]">{p.name}</p>
              <p className="text-xs text-gray-400">{p.tagline}</p>
            </div>
            <span className="text-xs font-semibold text-[#664930] group-hover:underline shrink-0">
              {p.cta}
            </span>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 mt-3">
        Affiliate disclosure: We may earn a commission if you open an account through these links, at no cost to you.
        Recommendations are based on relevance to this tool — not compensation.
      </p>
    </div>
  );
}
