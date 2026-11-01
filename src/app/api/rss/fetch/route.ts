import { NextResponse } from "next/server";
import { db } from "@/db";
import { rssItems } from "@/db/schema";
import { fetchRecentFeeds } from "@/lib/rss";

export async function POST() {
  const { items, failed: failedFeeds } = await fetchRecentFeeds(24);

  let saved = 0;
  if (items.length) {
    const inserted = await db
      .insert(rssItems)
      .values(items)
      .onConflictDoNothing({ target: rssItems.link })
      .returning({ id: rssItems.id });
    saved = inserted.length;
  }

  return NextResponse.json({
    fetched: items.length,
    saved,
    skippedDuplicates: items.length - saved,
    failedFeeds,
  });
}
