import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  guid: text("guid").notNull().unique(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  author: text("author"),
  publishedAt: timestamp("published_at"),
  titleKo: text("title_ko").notNull(),
  summaryKo: text("summary_ko").notNull(),
  category: text("category").notNull(),
  obsidianPath: text("obsidian_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;

// RSS 원문 저장용. Claude 번역·분류 전 단계라 AI 필드가 없고, 중복은 정규화된 link 기준이다.
export const rssItems = pgTable("rss_items", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  link: text("link").notNull().unique(),
  author: text("author"),
  summary: text("summary"), // RSS 원문 스니펫(임시 요약, 최대 500자)
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RssItem = typeof rssItems.$inferSelect;
