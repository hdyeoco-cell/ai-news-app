"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CollectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [failed, setFailed] = useState(false);

  async function collect() {
    setLoading(true);
    setMsg("");
    setFailed(false);
    try {
      const res = await fetch("/api/collect", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      const parts = [`새 기사 ${d.saved}건 저장 (중복 ${d.skippedDuplicates}건 제외)`];
      if (d.processFailed > 0) {
        parts.push(
          d.saved === 0
            ? `처리 실패 ${d.processFailed}건 - API 키·크레딧을 확인하세요 (서버 로그 참고)`
            : `처리 실패 ${d.processFailed}건`,
        );
      }
      if (d.failedFeeds?.length) parts.push(`피드 ${d.failedFeeds.length}개 수집 실패`);
      setMsg(parts.join(" · "));
      setFailed(d.processFailed > 0 || d.failedFeeds?.length > 0);
      router.refresh();
    } catch {
      setMsg("수집에 실패했습니다. 서버 로그를 확인하세요.");
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className={`text-sm ${failed ? "text-red-600" : "text-zinc-500"}`}>{msg}</span>}
      <button
        onClick={collect}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "수집·번역 중..." : "새 기사 수집"}
      </button>
    </div>
  );
}
