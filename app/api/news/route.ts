import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/fetchNews";

export const revalidate = 1800; // 30 minutes

export async function GET() {
  const items = await fetchNews();
  return NextResponse.json(items);
}
