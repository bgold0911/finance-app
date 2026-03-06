export interface NewsItem {
  title: string;
  url: string;
  source: string;
  pubDate: string;
}

function parseRSS(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const block = match[1];

    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ??
      block.match(/<title>([\s\S]*?)<\/title>/);

    const linkMatch =
      block.match(/<link>(https?:\/\/[^<]+)<\/link>/) ??
      block.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/);

    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    const title = titleMatch?.[1]?.trim();
    const url = linkMatch?.[1]?.trim();

    if (title && url) {
      items.push({ title, url, source, pubDate: pubDateMatch?.[1]?.trim() ?? "" });
    }

    if (items.length >= 6) break;
  }

  return items;
}

const FEEDS = [
  { url: "https://feeds.reuters.com/reuters/businessNews", source: "Reuters" },
  { url: "https://rss.marketwatch.com/rss/topstories", source: "MarketWatch" },
];

export async function fetchNews(): Promise<NewsItem[]> {
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RSS reader)",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        next: { revalidate: 1800 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRSS(xml, feed.source);
      if (items.length > 0) return items;
    } catch {
      // try next feed
    }
  }
  return [];
}
