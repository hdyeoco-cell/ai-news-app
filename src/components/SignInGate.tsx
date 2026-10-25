"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export function SignInGate() {
  const { openSignIn } = useClerk();

  useEffect(() => {
    openSignIn();
  }, [openSignIn]);

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-zinc-600 dark:text-zinc-400">로그인이 필요합니다.</p>
      <button
        type="button"
        onClick={() => openSignIn()}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        로그인
      </button>
    </div>
  );
}
