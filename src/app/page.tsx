import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { CollectButton } from "@/components/CollectButton";
import { SignInGate } from "@/components/SignInGate";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { CATEGORIES } from "@/lib/categories";

type SearchParams = Promise<{ category?: string }>;

const tab = (active: boolean) =>
  `rounded-full px-3 py-1 text-sm ${active ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"}`;

async function Feed({ searchParams }: { searchParams: SearchParams }) {
  const { category } = await searchParams;
  const rows = await db
    .select()
    .from(articles)
    .where(category ? eq(articles.category, category) : undefined)
    .orderBy(desc(articles.publishedAt))
    .limit(100);

  return (
    <>
      <nav className="mb-6 flex flex-wrap gap-2">
        <Link href="/" className={tab(!category)}>
          전체
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/?category=${encodeURIComponent(c)}`} className={tab(category === c)}>
            {c}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="py-20 text-center text-zinc-500">기사가 없습니다. &apos;새 기사 수집&apos; 버튼을 눌러보세요.</p>
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
      <Suspense fallback={<p className="py-20 text-center text-zinc-500">불러오는 중...</p>}>
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
