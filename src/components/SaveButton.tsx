"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SaveButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/articles/${id}/obsidian`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `저장 실패 (서버 응답 ${res.status}, JSON 아님)`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={save}
        disabled={loading}
        className="rounded-md border border-violet-300 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950"
      >
        {loading ? "저장 중..." : "Obsidian에 저장"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
