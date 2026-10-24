import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const rows = await db
    .select()
    .from(articles)
    .where(category ? eq(articles.category, category) : undefined)
    .orderBy(desc(articles.publishedAt))
    .limit(100);
  return NextResponse.json(rows);
}
