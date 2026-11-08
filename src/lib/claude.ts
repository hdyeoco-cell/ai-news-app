import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { CATEGORIES } from "./categories";
import type { RawArticle } from "./rss";

const client = new Anthropic({ maxRetries: 2 }); // 429/5xx/연결 오류 자동 재시도
const MODEL = "claude-haiku-5-5";

const resultSchema = z.object({
  titleKo: z.string().min(1),
  summaryKo: z.string().min(1),
  category: z.enum(CATEGORIES),
});

export type Processed = z.infer<typeof resultSchema>;

const PROMPT = (a: RawArticle) => `다음 영문 AI 뉴스 기사를 처리하세요.

제목: ${a.title}
본문: ${a.content}

titleKo: 자연스러운 한국어 제목
summaryKo: 한국어 3~4문장 요약
category: 다음 중 정확히 하나: ${CATEGORIES.join(", ")}`;

// structured outputs: 응답이 스키마를 따르도록 API가 강제한다.
// 스키마 위반(refusal, max_tokens 절단 등)으로 parsed_output이 비면 1회만 재시도한다.
export async function processArticle(a: RawArticle): Promise<Processed> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.messages.parse({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: PROMPT(a) }],
        output_config: { format: zodOutputFormat(resultSchema) },
      });
      if (res.parsed_output) return res.parsed_output;
      lastError = new Error(`구조화 출력 없음 (stop_reason: ${res.stop_reason})`);
    } catch (e) {
      // API 오류(인증/요청 오류 등)는 재시도해도 소용없으므로 바로 던진다
      if (e instanceof Anthropic.APIError) throw e;
      lastError = e;
    }
  }
  throw lastError;
}

export async function processAll(items: RawArticle[], concurrency = 4) {
  const done: { raw: RawArticle; result: Processed }[] = [];
  let failed = 0;
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const raw = items[next++];
      try {
        done.push({ raw, result: await processArticle(raw) });
      } catch (e) {
        failed++;
        console.error("처리 실패:", raw.title, e);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { done, failed };
}
