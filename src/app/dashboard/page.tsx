import { Show, UserButton } from "@clerk/nextjs";
import { count, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { FetchNewsButton } from "@/components/FetchNewsButton";
import { Pagination } from "@/components/Pagination";
import { SignInGate } from "@/components/SignInGate";
import { db } from "@/db";
import { articles } from "@/db/schema";

const DASHBOARD_CATEGORIES = ["비즈니스/투자", "LLM/생성AI"];

const PAGE_SIZE = 9;

type SearchParams = Promise<{ page?: string }>;

async function DashboardFeed({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageParam } = await searchParams;
  const where = inArray(articles.category, DASHBOARD_CATEGORIES);

  const [{ total }] = await db.select({ total: count() }).from(articles).where(where);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requested = Number.parseInt(pageParam ?? "1", 10);
  // 잘못된 값이나 범위를 벗어난 값은 가장 가까운 유효 페이지로 맞춘다.
  const page = Math.min(Math.max(Number.isNaN(requested) ? 1 : requested, 1), totalPages);

  const rows = await db
    .select()
    .from(articles)
    .where(where)
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return rows.length === 0 ? (
    <p className="py-20 text-center text-zinc-500">해당 카테고리의 기사가 없습니다.</p>
  ) : (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/dashboard" />
    </>
  );
}

export default function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
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
              <FetchNewsButton />
              <UserButton />
            </Show>
          </Suspense>
        </div>
      </header>
      <Suspense fallback={<p className="py-20 text-center text-zinc-500">불러오는 중...</p>}>
        <Show when="signed-in">
          <DashboardFeed searchParams={searchParams} />
        </Show>
        <Show when="signed-out">
          <SignInGate />
        </Show>
      </Suspense>
    </main>
  );
}
