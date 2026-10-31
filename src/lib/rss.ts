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

export async function fetchAllFeeds(): Promise<{ articles: RawArticle[]; failed: string[] }> {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ source, url }) => {
      const feed = await parser.parseURL(url);
      return feed.items.slice(0, PER_FEED_LIMIT).flatMap((item): RawArticle[] => {
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
      });
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
