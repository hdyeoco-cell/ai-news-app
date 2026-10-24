import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { ObsidianConfigError, saveToObsidian } from "@/lib/obsidian";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "잘못된 id입니다." }, { status: 400 });

  const [article] = await db.select().from(articles).where(eq(articles.id, id));
  if (!article) return NextResponse.json({ error: "기사를 찾을 수 없습니다." }, { status: 404 });
  if (article.obsidianPath) return NextResponse.json({ path: article.obsidianPath, alreadySaved: true });

  try {
    const notePath = await saveToObsidian(article);
    await db.update(articles).set({ obsidianPath: notePath }).where(eq(articles.id, id));
    return NextResponse.json({ path: notePath, alreadySaved: false });
  } catch (e) {
    if (e instanceof ObsidianConfigError) return NextResponse.json({ error: e.message }, { status: 500 });
    console.error("Obsidian 저장 실패:", e);
    return NextResponse.json({ error: "노트 저장에 실패했습니다." }, { status: 500 });
  }
}
