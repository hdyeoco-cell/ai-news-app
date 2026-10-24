import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CATEGORIES } from "./categories";
import type { RawArticle } from "./rss";

const client = new Anthropic();
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

JSON 객체 하나만 출력하세요(코드블록 금지):
{"titleKo": "자연스러운 한국어 제목", "summaryKo": "한국어 3~4문장 요약", "category": "<카테고리>"}

category는 다음 중 정확히 하나: ${CATEGORIES.join(", ")}`;

export async function processArticle(a: RawArticle): Promise<Processed> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: PROMPT(a) }],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return resultSchema.parse(JSON.parse(json));
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
