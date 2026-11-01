import Link from "next/link";

const item = (active: boolean) =>
  `rounded-full px-3 py-1 text-sm ${active ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`;
const disabled = "rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-400 opacity-50 dark:bg-zinc-800";

// 현재 페이지 앞뒤 2개 + 처음/끝 페이지만 보여주고 나머지는 "…"로 줄인다.
function pageList(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total]);
  for (let p = current - 2; p <= current + 2; p++) if (p >= 1 && p <= total) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav aria-label="페이지 이동" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={item(false)}>
          이전
        </Link>
      ) : (
        <span className={disabled}>이전</span>
      )}
      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-zinc-400">
            …
          </span>
        ) : (
          <Link key={p} href={href(p)} className={item(p === page)} aria-current={p === page ? "page" : undefined}>
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={item(false)}>
          다음
        </Link>
      ) : (
        <span className={disabled}>다음</span>
      )}
    </nav>
  );
}
