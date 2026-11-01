import Parser from "rss-parser";

export const FEEDS = [
  { source: "TechCrunch", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { source: "The Verge", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { source: "VentureBeat", url: "https://venturebeat.com/category/ai/feed/" },
];

const PER_FEED_LIMIT = 10;

export type RawArticle = {
  guid: string;
  source: string;
  title: string;
  link: string;
  author: string | null;
  content: string;
  publishedAt: Date | null;
};

const parser = new Parser({ timeout: 10_000 });

function toRawArticle(source: string, item: Parser.Item): RawArticle[] {
  const link = item.link;
  const title = item.title;
  if (!link || !title) return [];
  return [
    {
      guid: item.guid || link,
      source,
      title,
      link,
      author: item.creator?.trim() || null,
      content: (item.contentSnippet || item.content || "").slice(0, 3000),
      publishedAt: item.isoDate ? new Date(item.isoDate) : null,
    },
  ];
}

// 중복 판정용 URL 정규화: 해시·추적 쿼리 제거, 호스트 소문자화, 끝의 / 제거
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || ["ref", "fbclid", "gclid"].includes(key.toLowerCase())) {
        u.searchParams.delete(key);
      }
    }
    u.hostname = u.hostname.toLowerCase();
    const s = u.toString();
    return s.endsWith("/") && !u.search ? s.slice(0, -1) : s;
  } catch {
    return raw.trim();
  }
}

export type RecentItem = {
  source: string;
  title: string;
  link: string; // 정규화된 URL
  author: string | null;
  summary: string | null;
  publishedAt: Date;
};

const RECENT_SOURCES = ["TechCrunch", "The Verge"];
const SUMMARY_MAX = 500;

// 최근 sinceHours 시간 내 기사만 반환. 피드당 개수 제한 없음, publishedAt 없는 항목은 제외.
export async function fetchRecentFeeds(
  sinceHours = 24,
): Promise<{ items: RecentItem[]; failed: string[] }> {
  const targets = FEEDS.filter((f) => RECENT_SOURCES.includes(f.source));
  const since = Date.now() - sinceHours * 3600_000;
  const results = await Promise.allSettled(
    targets.map(async ({ source, url }) => {
      const feed = await parser.parseURL(url);
      return feed.items.flatMap((item) => toRawArticle(source, item));
    }),
  );

  const byLink = new Map<string, RecentItem>();
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status !== "fulfilled") {
      failed.push(targets[i].source);
      return;
    }
    for (const a of r.value) {
      if (!a.publishedAt || a.publishedAt.getTime() < since) continue;
      const link = normalizeUrl(a.link);
      if (byLink.has(link)) continue;
      byLink.set(link, {
        source: a.source,
        title: a.title,
        link,
        author: a.author,
        summary: a.content.slice(0, SUMMARY_MAX) || null,
        publishedAt: a.publishedAt,
      });
    }
  });
  return { items: [...byLink.values()], failed };
}

export async function fetchAllFeeds(): Promise<{ articles: RawArticle[]; failed: string[] }> {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ source, url }) => {
      const feed = await parser.parseURL(url);
      return feed.items.slice(0, PER_FEED_LIMIT).flatMap((item) => toRawArticle(source, item));
    }),
  );

  const articles: RawArticle[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") articles.push(...r.value);
    else failed.push(FEEDS[i].source);
  });
  return { articles, failed };
}
