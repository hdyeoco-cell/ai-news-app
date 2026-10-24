import { SaveButton } from "@/components/SaveButton";
import type { Article } from "@/db/schema";

export function ArticleCard({ article: a }: { article: Article }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {a.category}
        </span>
        <span>
          {a.source}
          {a.publishedAt && ` · ${a.publishedAt.toLocaleDateString("ko-KR")}`}
        </span>
      </div>
      <h2 className="text-lg font-semibold leading-snug">{a.titleKo}</h2>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{a.summaryKo}</p>
      <div className="mt-auto flex items-center justify-between gap-2">
        <a
          href={a.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          원문 보기 →
        </a>
        {a.obsidianPath ? (
          <span
            title={a.obsidianPath}
            className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300"
          >
            Obsidian 저장됨
          </span>
        ) : (
          <SaveButton id={a.id} />
        )}
      </div>
      <p className="text-xs text-zinc-400">{a.title}</p>
    </article>
  );
}
