import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Article } from "@/db/schema";

export class ObsidianConfigError extends Error {}

const MAX_NAME_LENGTH = 80;

function sanitizeFileName(name: string) {
  return name
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
}

async function exists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function yamlString(s: string) {
  return JSON.stringify(s);
}

function buildNote(a: Article) {
  const published = a.publishedAt ? a.publishedAt.toISOString().slice(0, 10) : "";
  const tag = a.category.replace(/\s+/g, "-");
  return `---
title: ${yamlString(a.titleKo)}
source: ${yamlString(a.source)}
category: ${yamlString(a.category)}
published: ${published}
url: ${yamlString(a.link)}
tags:
  - ai-news
  - ${yamlString(tag)}
---

# ${a.titleKo}

${a.summaryKo}

- 원문: [${a.source}](${a.link})
- 원제목: ${a.title}
`;
}

/** 기사를 Obsidian 볼트에 노트로 저장하고 볼트 기준 상대 경로를 반환한다. */
export async function saveToObsidian(a: Article): Promise<string> {
  const vault = process.env.OBSIDIAN_VAULT_PATH;
  if (!vault) throw new ObsidianConfigError("OBSIDIAN_VAULT_PATH가 설정되지 않았습니다. .env.local을 확인하세요.");
  if (!(await exists(vault))) throw new ObsidianConfigError(`볼트 폴더를 찾을 수 없습니다: ${vault}`);

  const folder = process.env.OBSIDIAN_NEWS_FOLDER || "AI News";
  const dir = path.resolve(vault, folder);
  const root = path.resolve(vault);
  if (dir !== root && !dir.startsWith(root + path.sep)) {
    throw new ObsidianConfigError("OBSIDIAN_NEWS_FOLDER가 볼트 밖을 가리킵니다.");
  }
  await mkdir(dir, { recursive: true });

  const date = (a.publishedAt ?? a.createdAt).toISOString().slice(0, 10);
  const base = `${date} ${sanitizeFileName(a.titleKo) || `article-${a.id}`}`;
  let file = path.join(dir, `${base}.md`);
  for (let n = 2; await exists(file); n++) file = path.join(dir, `${base}-${n}.md`);

  await writeFile(file, buildNote(a), { encoding: "utf8", flag: "wx" });
  return path.relative(root, file);
}
