# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트
해외 AI 뉴스(TechCrunch, The Verge, VentureBeat RSS)를 수집 → Claude(`claude-haiku-5-5`)가 한국어 제목/3~4문장 요약/카테고리로 변환 → Neon DB 저장 → 카드 UI. 마음에 드는 기사만 Obsidian 볼트에 마크다운 노트로 저장한다. 학습용 단일 사용자 프로젝트이며 **로컬 실행 전제**다. 요구사항·진행 현황의 기준은 `PRD.md`이고, 작업 전에 PRD 11절(남은 일)을 확인한다.

스택: Next.js 16(App Router, `cacheComponents`) · Tailwind 4 · Neon + Drizzle · `@anthropic-ai/sdk` · rss-parser · zod.

## 범위 (PRD 4절)
- MVP와 Obsidian 저장은 코드 작성·빌드 완료, **실제 키/DB로 end-to-end 검증 전** 상태다.
- 진행 중(`auth` 브랜치): Clerk 인증. 접속 시 로그인 모달(`SignInGate`, `openSignIn()`)이 자동으로 뜨고, 비로그인이면 `page.tsx`가 기사 목록·수집 버튼 대신 게이트를 렌더한다(`<Show>`는 `<Suspense>` 안). `src/proxy.ts`는 `/api`·`/trpc`만 로그인 필수로 막고 비로그인에는 401 JSON을 준다. `/sign-in`·`/sign-up` 페이지는 폴백으로 남아 있다.
- 제외/이후 단계: Cron 자동 수집(Vercel 배포 시). Notion 저장은 Obsidian으로 대체되어 폐기됐으니 되살리지 말 것.
- 비용 통제가 설계 원칙이다. 수집 1회 최대 15건, Claude 동시 4개, 수집 API `maxDuration = 300`. 이 한도를 늘리기 전에 사용자에게 확인한다.

## UI 가이드
화면(레이아웃, 카테고리 바, 뉴스 카드, 버튼, 색상·타이포그래피 등 Tailwind 스타일 규칙)을 만들거나 고칠 때는 먼저 `ui.md`를 읽고 따른다. 새 스타일 규칙이 생기면 `ui.md`도 함께 갱신한다.

## Next.js 주의
`AGENTS.md`에 있듯 이 Next.js(16.x)는 기존 지식과 API/규칙이 다를 수 있다. 코드를 쓰기 전 `node_modules/next/dist/docs/`의 해당 가이드를 읽는다. `cacheComponents`가 켜져 있어, 요청 시점 데이터(`searchParams`, DB 조회)는 `<Suspense>` 안에서 읽어야 한다 (`src/app/page.tsx` 참고).

## 명령어
- `npm run dev` — 개발 서버 (http://localhost:3000)
- `npm run build` / `npm run start` — 프로덕션 빌드/실행
- `npm run lint` — ESLint
- `npx tsc --noEmit` — 타입 검사. `npm run build`와 함께 PRD 성공 기준이므로 변경 후 둘 다 통과시킨다.
- `npx drizzle-kit push` — `src/db/schema.ts`를 DB에 반영 (마이그레이션 파일 없이 push 방식). 스키마 변경 시 필수. 현재 `obsidian_path` 컬럼 포함 전체 스키마가 Neon에 반영돼 있다.
- 테스트 러너는 없다. 검증은 PRD 10절의 수동 시나리오로 한다.

## 환경 변수 (`.env.local`, 템플릿은 `.env.example`)
| 변수 | 비고 |
|---|---|
| `ANTHROPIC_API_KEY`, `DATABASE_URL` | 사용자가 직접 입력. 커밋·채팅에 노출 금지 |
| `OBSIDIAN_VAULT_PATH` | `C:\31.AI_PJT\03.Obsidian_260920\HDsObsidian` |
| `OBSIDIAN_NEWS_FOLDER` | 현재 `8.Archive (기록)/13. Test` (테스트용). 운영 전환은 이 값만 바꾸면 된다 |

`drizzle.config.ts`는 `.env.local`을 직접 로드한다.

## 아키텍처
데이터 흐름: `CollectButton` → `POST /api/collect` → `lib/rss.ts` → `lib/claude.ts` → `db` → 서버 컴포넌트 `page.tsx`가 DB에서 읽어 렌더 (카테고리 필터는 `/?category=`).

- **수집 (`src/app/api/collect/route.ts`)**: 전체 피드 수집 → DB에서 기존 guid 조회로 신규만 추림 → 최대 15건(`MAX_NEW_PER_RUN`) 처리, 나머지는 `deferred`로 보고 → `onConflictDoNothing({target: guid})`로 삽입. 중복 방지는 조회와 DB unique 제약의 이중 구조. 즉시 재수집 시 신규 저장 0건이어야 한다.
- **실패 격리**: 피드는 `Promise.allSettled`, 기사 처리는 개별 try/catch. 한 건 실패가 전체를 중단시키지 않는 것이 요구사항이다. 이 성질을 깨지 말 것.
- **RSS (`lib/rss.ts`)**: 피드 목록은 `FEEDS` 상수 한 곳에서 관리 (피드당 10건). URL이 바뀌거나 막히면 여기서 고친다.
- **AI (`lib/claude.ts`)**: 기사당 Claude 1회 호출, 응답에서 JSON을 잘라내 `zod`로 검증(`resultSchema`). 검증 실패 기사는 건너뛴다. 카테고리 7종(LLM/생성AI, 로보틱스, 이미지/영상AI, AI 칩/인프라, 정책/규제, 비즈니스/투자, 기타)은 `lib/categories.ts`의 `CATEGORIES`가 프롬프트·검증·UI 탭의 단일 출처다.
- **Obsidian (`lib/obsidian.ts`, `POST /api/articles/[id]/obsidian`)**: 볼트 폴더에 `fs`로 직접 쓰기라 **로컬 실행 전용**(서버리스 불가, 배포 시 REST API 방식 재검토). 노트는 YAML frontmatter(title, source, category, published, url, tags) + 한국어 제목/요약 + 원문 링크 + 원제목. 안전장치: 파일명 금지 문자 정리, `flag: "wx"` + `-2` 접미사로 덮어쓰기 금지, 볼트 밖 경로 차단, 저장 후 `articles.obsidian_path`(볼트 상대 경로, null이면 미저장)로 중복 저장 방지, 경로 미설정 시 안내 메시지.
- **DB (`src/db`)**: Neon HTTP 드라이버 + Drizzle, 테이블은 `articles` 하나 (PRD 6절에 컬럼 설명).
- 경로 별칭 `@/` = `src/`.
