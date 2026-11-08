# AI 뉴스 수집기

해외 AI 뉴스(TechCrunch, The Verge, VentureBeat)를 RSS로 수집하고, Claude가 한국어 제목·3~4문장 요약·카테고리로 변환해 카드로 보여주는 웹 앱입니다. 마음에 드는 기사만 Obsidian 볼트에 마크다운 노트로 저장합니다.

학습용 단일 사용자 프로젝트이며 **로컬 실행을 전제**로 합니다. 요구사항과 진행 현황의 기준은 [`PRD.md`](./PRD.md)입니다.

## 주요 기능
- **뉴스 수집**: 피드를 병렬로 가져와 신규 기사만 Claude로 처리(1회 최대 15건, 동시 4개)하고 Neon DB에 저장합니다. 한 피드·한 기사가 실패해도 나머지는 계속 진행합니다.
- **카테고리**: LLM/생성AI, 로보틱스, 이미지/영상AI, AI 칩/인프라, 정책/규제, 비즈니스/투자, 기타. 탭으로 필터링합니다(`/?category=`).
- **대시보드** (`/dashboard`): 비즈니스/투자·LLM/생성AI 기사를 9개 단위로 페이지 나눠 보여주고, "뉴스 가져오기"로 최근 24시간 RSS 원문을 `rss_items`에 저장합니다(Claude 호출 없음).
- **Obsidian 저장**: 카드의 "Obsidian에 저장" 버튼이 볼트 폴더에 노트(YAML frontmatter + 한국어 제목/요약 + 원문 링크)를 만듭니다. 덮어쓰기와 중복 저장은 막습니다.
- **로그인**: Clerk. 비로그인 상태에서는 로그인 모달이 뜨고, `/api`는 401을 돌려줍니다.

## 기술 스택
Next.js 16 (App Router, `cacheComponents`) · Tailwind CSS 4 · Neon + Drizzle ORM · `@anthropic-ai/sdk`(모델 `claude-haiku-5-5`) · rss-parser · zod · Clerk

## 실행 방법
사전 준비: Node.js, Neon 프로젝트(PostgreSQL), Anthropic API 키, Clerk 앱, Obsidian 볼트 폴더.

1. 의존성 설치
   ```bash
   npm install
   ```
2. `.env.local`을 만들고 아래 환경 변수를 채웁니다.
3. DB 테이블 생성
   ```bash
   npx drizzle-kit push
   ```
4. 개발 서버 실행 후 http://localhost:3000 접속
   ```bash
   npm run dev
   ```

### 환경 변수 (`.env.local`)
| 변수 | 설명 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `DATABASE_URL` | Neon 접속 문자열 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk 키 |
| `OBSIDIAN_VAULT_PATH` | Obsidian 볼트 절대 경로 (로컬 전용) |
| `OBSIDIAN_NEWS_FOLDER` | 볼트 안의 저장 폴더 (기본값 `AI News`) |

`.env.local`은 `.gitignore`로 제외되어 있습니다. 키를 커밋하거나 채팅에 노출하지 마세요.

## 명령어
| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (webpack) |
| `npm run build` / `npm run start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | 타입 검사 (변경 후 `build`와 함께 통과시킬 것) |
| `npx drizzle-kit push` | `src/db/schema.ts`를 DB에 반영 |

테스트 러너는 없고, 검증은 PRD 10절의 수동 시나리오로 합니다.

## 구조
```
src/
├── app/
│   ├── page.tsx                 # 전체 목록 (카테고리 필터)
│   ├── dashboard/page.tsx       # 대시보드
│   └── api/
│       ├── collect/             # POST 수집 → Claude → DB
│       ├── rss/fetch/           # POST 최근 24시간 RSS 원문 저장
│       └── articles/[id]/obsidian/  # POST Obsidian 노트 저장
├── components/                  # ArticleCard, CollectButton, SaveButton 등
├── lib/                         # rss.ts, claude.ts, categories.ts, obsidian.ts
├── db/                          # Drizzle 스키마 (articles, rss_items)
└── proxy.ts                     # Clerk: /api 로그인 필수
```

데이터 흐름: `CollectButton` → `POST /api/collect` → `lib/rss.ts` → `lib/claude.ts` → DB → 서버 컴포넌트가 읽어 렌더.

## 비용·안전 설계
- 수집 1회 최대 15건, Claude 동시 4개, 수집 API `maxDuration = 300`. 한도를 늘리기 전에는 비용을 먼저 확인하세요.
- 중복 수집은 RSS guid 조회와 DB unique 제약으로 이중 방지합니다. 즉시 재수집하면 신규 저장이 0건이어야 합니다.

## 제한 사항
- Obsidian 저장은 볼트 폴더에 `fs`로 직접 쓰므로 **로컬 실행 전용**입니다. Vercel 같은 서버리스에서는 동작하지 않습니다(배포 시 Obsidian Local REST API 방식을 재검토).
- 저장 폴더 기본 설정은 테스트용입니다. 운영 시 `OBSIDIAN_NEWS_FOLDER`만 바꾸면 됩니다.
- 이후 단계: Cron 자동 수집(Vercel 배포 시).
