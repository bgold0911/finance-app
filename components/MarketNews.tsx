import { fetchNews, type NewsItem } from "@/lib/fetchNews";

function timeAgo(pubDate: string): string {
  if (!pubDate) return "";
  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export default async function MarketNews() {
  let items: NewsItem[] = [];
  try {
    items = await fetchNews();
  } catch {
    return null;
  }
  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#664930]">Today&apos;s Market News</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Updated every 30 minutes · {items[0]?.source ?? "Reuters"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 hover:border-[#997E67] hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#664930] bg-[#FAF6F2] border border-[#CCBEB1] px-2 py-0.5 rounded-full">
                {item.source}
              </span>
              {item.pubDate && (
                <span className="text-[10px] text-gray-400">{timeAgo(item.pubDate)}</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-[#664930] transition-colors line-clamp-3">
              {item.title}
            </p>
            <span className="text-xs text-[#664930] font-medium mt-auto group-hover:underline">
              Read more →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
