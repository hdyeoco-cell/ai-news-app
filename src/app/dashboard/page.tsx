import { Show, UserButton } from "@clerk/nextjs";
import { desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { SignInGate } from "@/components/SignInGate";
import { db } from "@/db";
import { articles } from "@/db/schema";

const DASHBOARD_CATEGORIES = ["비즈니스/투자", "LLM/생성AI"];

async function DashboardFeed() {
  const rows = await db
    .select()
    .from(articles)
    .where(inArray(articles.category, DASHBOARD_CATEGORIES))
    .orderBy(desc(articles.publishedAt))
    .limit(100);

  return rows.length === 0 ? (
    <p className="py-20 text-center text-zinc-500">해당 카테고리의 기사가 없습니다.</p>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="mt-1 text-sm text-zinc-500">{DASHBOARD_CATEGORIES.join(" · ")} 최신 기사</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
            ← 전체 목록
          </Link>
          <Suspense>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </Suspense>
        </div>
      </header>
      <Suspense fallback={<p className="py-20 text-center text-zinc-500">불러오는 중...</p>}>
        <Show when="signed-in">
          <DashboardFeed />
        </Show>
        <Show when="signed-out">
          <SignInGate />
        </Show>
      </Suspense>
    </main>
  );
}
