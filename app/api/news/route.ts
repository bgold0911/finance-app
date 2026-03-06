import { NextResponse } from "next/server";

export const revalidate = 1800; // 30 minutes

interface NewsItem {
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

    // Title: handles both plain and CDATA
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ??
      block.match(/<title>([\s\S]*?)<\/title>/);

    // Link: Reuters uses <link/> followed by text, also handle <link>url</link>
    const linkMatch =
      block.match(/<link>(https?:\/\/[^<]+)<\/link>/) ??
      block.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/);

    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    const title = titleMatch?.[1]?.trim();
    const url = linkMatch?.[1]?.trim();

    if (title && url) {
      items.push({
        title,
        url,
        source,
        pubDate: pubDateMatch?.[1]?.trim() ?? "",
      });
    }

    if (items.length >= 6) break;
  }

  return items;
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RSS reader)",
      "Accept": "application/rss+xml, application/xml, text/xml",
    },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Feed ${url} returned ${res.status}`);
  const xml = await res.text();
  return parseRSS(xml, source);
}

export async function GET() {
  const feeds = [
    { url: "https://feeds.reuters.com/reuters/businessNews", source: "Reuters" },
    { url: "https://rss.marketwatch.com/rss/topstories", source: "MarketWatch" },
  ];

  for (const feed of feeds) {
    try {
      const items = await fetchFeed(feed.url, feed.source);
      if (items.length > 0) {
        return NextResponse.json(items);
      }
    } catch {
      // try next feed
    }
  }

  return NextResponse.json([]);
}
