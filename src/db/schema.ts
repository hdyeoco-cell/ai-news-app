import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  guid: text("guid").notNull().unique(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  publishedAt: timestamp("published_at"),
  titleKo: text("title_ko").notNull(),
  summaryKo: text("summary_ko").notNull(),
  category: text("category").notNull(),
  obsidianPath: text("obsidian_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
