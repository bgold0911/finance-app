import { NextResponse } from "next/server";
import { fetchMarketQuotes } from "@/lib/fetchMarket";

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const quotes = await fetchMarketQuotes();
    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
