import Link from "next/link";

// 일반 GET 폼이라 '검색' 버튼 클릭과 Enter 키 모두 /?q=... 로 이동한다 (JS 불필요).
export function SearchForm({ q, category }: { q?: string; category?: string }) {
  const clearHref = category ? `/?category=${encodeURIComponent(category)}` : "/";
  return (
    <form action="/" method="get" role="search" className="flex items-center gap-2">
      {category && <input type="hidden" name="category" value={category} />}
      <input
        type="search"
        name="q"
        defaultValue={q ?? ""}
        placeholder="키워드로 뉴스 검색 (제목·요약)"
        aria-label="키워드 검색"
        className="w-56 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
      />
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        검색
      </button>
      {q && (
        <Link href={clearHref} className="text-sm text-zinc-500 hover:text-blue-600">
          초기화
        </Link>
      )}
    </form>
  );
}
