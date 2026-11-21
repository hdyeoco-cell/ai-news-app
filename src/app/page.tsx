import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { CollectButton } from "@/components/CollectButton";
import { SearchForm } from "@/components/SearchForm";
import { SignInGate } from "@/components/SignInGate";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { CATEGORIES } from "@/lib/categories";

type SearchParams = Promise<{ category?: string; q?: string }>;

// LIKE 와일드카드(%, _, \)를 이스케이프해 입력값을 문자 그대로 검색한다.
const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

const tab = (active: boolean) =>
  `rounded-full px-3 py-1 text-sm ${active ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"}`;

async function Feed({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = params.category;
  const q = params.q?.trim().slice(0, 100) || undefined;
  const pattern = q ? `%${escapeLike(q)}%` : undefined;
  const rows = await db
    .select()
    .from(articles)
    .where(
      and(
        category ? eq(articles.category, category) : undefined,
        pattern
          ? or(
              ilike(articles.titleKo, pattern),
              ilike(articles.summaryKo, pattern),
              ilike(articles.title, pattern),
            )
          : undefined,
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(100);

  // 카테고리 탭 이동 시 검색어를 유지한다.
  const tabHref = (c?: string) => {
    const sp = new URLSearchParams();
    if (c) sp.set("category", c);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <nav className="flex flex-wrap gap-2">
          <Link href={tabHref()} className={tab(!category)}>
            전체
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={tabHref(c)} className={tab(category === c)}>
              {c}
            </Link>
          ))}
        </nav>
        <SearchForm q={q} category={category} />
      </div>
      {rows.length === 0 ? (
        <p className="py-20 text-center text-zinc-500">
          {q
            ? `'${q}'에 대한 검색 결과가 없습니다.`
            : "기사가 없습니다. '새 기사 수집' 버튼을 눌러보세요."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">AI 뉴스 수집기</h1>
        <div className="flex items-center gap-3">
          <Suspense>
            <Show when="signed-in">
              <CollectButton />
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal" />
              <SignUpButton mode="modal" />
            </Show>
          </Suspense>
        </div>
      </header>
      <Suspense
        fallback={
          <p className="py-20 text-center text-zinc-500">불러오는 중...</p>
        }
      >
        <Show when="signed-in">
          <Feed searchParams={searchParams} />
        </Show>
        <Show when="signed-out">
          <SignInGate />
        </Show>
      </Suspense>
    </main>
  );
}
