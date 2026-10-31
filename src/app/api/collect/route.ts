import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { processAll } from "@/lib/claude";
import { fetchAllFeeds } from "@/lib/rss";

export const maxDuration = 300;
const MAX_NEW_PER_RUN = 15;

export async function POST() {
  const { articles: fetched, failed: failedFeeds } = await fetchAllFeeds();

  const guids = fetched.map((a) => a.guid);
  const existing = guids.length
    ? await db.select({ guid: articles.guid }).from(articles).where(inArray(articles.guid, guids))
    : [];
  const seen = new Set(existing.map((e) => e.guid));
  const unseen = fetched.filter((a) => !seen.has(a.guid));
  const fresh = unseen.slice(0, MAX_NEW_PER_RUN);

  const { done, failed } = await processAll(fresh);

  if (done.length) {
    await db
      .insert(articles)
      .values(
        done.map(({ raw, result }) => ({
          guid: raw.guid,
          source: raw.source,
          title: raw.title,
          link: raw.link,
          author: raw.author,
          publishedAt: raw.publishedAt,
          ...result,
        })),
      )
      .onConflictDoNothing({ target: articles.guid });
  }

  return NextResponse.json({
    fetched: fetched.length,
    saved: done.length,
    skippedDuplicates: fetched.length - unseen.length,
    deferred: unseen.length - fresh.length,
    processFailed: failed,
    failedFeeds,
  });
}
