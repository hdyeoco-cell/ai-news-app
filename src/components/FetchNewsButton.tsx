"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FetchNewsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [failed, setFailed] = useState(false);

  async function fetchNews() {
    setLoading(true);
    setMsg("");
    setFailed(false);
    try {
      const res = await fetch("/api/rss/fetch", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      const parts = [`새 기사 ${d.saved}건 저장 (중복 ${d.skippedDuplicates}건 제외)`];
      if (d.failedFeeds?.length) parts.push(`피드 ${d.failedFeeds.length}개 수집 실패`);
      setMsg(parts.join(" · "));
      setFailed(d.failedFeeds?.length > 0);
      router.refresh();
    } catch {
      setMsg("뉴스 가져오기에 실패했습니다. 서버 로그를 확인하세요.");
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className={`text-sm ${failed ? "text-red-600" : "text-zinc-500"}`}>{msg}</span>}
      <button
        onClick={fetchNews}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "가져오는 중..." : "뉴스 가져오기"}
      </button>
    </div>
  );
}
