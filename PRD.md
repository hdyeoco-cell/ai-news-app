# PRD — AI 뉴스 수집기

## 1. 개요
해외 AI 뉴스를 RSS로 자동 수집하고, Claude가 한국어로 번역·요약·카테고리 분류하여 카드 형태로 보여주는 웹 애플리케이션. 마음에 드는 기사는 Obsidian 볼트(`HDsObsidian`)에 마크다운 노트로 저장한다.

## 2. 목표와 배경
- 영문 AI 뉴스를 매번 읽고 정리하는 수고를 줄인다.
- 한국어 요약으로 빠르게 훑고, 중요한 기사만 개인 지식베이스(Obsidian)에 축적한다.
- 학습용 실습 프로젝트이므로 단순하고 비용 통제가 쉬운 구조를 택한다.

## 3. 사용자
- 1차: 본인(개인 사용자, 한국어 사용, 로컬 환경에서 실행)

## 4. 범위

### 4.1 MVP (구현·빌드 완료, 실제 키/DB 실행 검증 대기)
| 기능 | 설명 |
|---|---|
| 뉴스 수집 | TechCrunch, The Verge, VentureBeat RSS를 병렬 수집. 한 피드가 실패해도 나머지는 진행 |
| AI 처리 | 기사당 Claude 1회 호출로 한국어 제목, 3~4문장 요약, 카테고리 반환. 결과는 `zod`로 검증, 실패 기사는 건너뜀 |
| 카테고리 | LLM/생성AI, 로보틱스, 이미지/영상AI, AI 칩/인프라, 정책/규제, 비즈니스/투자, 기타 |
| 중복 방지 | RSS guid 기준. 저장 전 DB 조회 + DB unique 제약 |
| 카드 UI | 카테고리 배지, 한국어 제목/요약, 출처·날짜, 원문 링크, 원제목 |
| 필터 | 카테고리 탭 (`/?category=`) |
| 수집 트리거 | 화면의 "새 기사 수집" 버튼 → `POST /api/collect` (1회 최대 15건 처리) |

### 4.2 2단계: Obsidian 저장 (코드 작성 완료, 검증 대기)
Notion 아카이빙을 대체한다.
- 방식: 볼트 폴더에 `.md` 파일 직접 쓰기 (플러그인 불필요, **로컬 실행 전용**)
- 대상: 카드의 "Obsidian에 저장" 버튼으로 사용자가 고른 기사만
- **볼트**: `C:\31.AI_PJT\03.Obsidian_260920\HDsObsidian`
- **저장 위치**: `8.Archive (기록)/13. Test/YYYY-MM-DD 제목.md` (폴더는 이미 존재 확인)
- 노트 내용: YAML frontmatter(title, source, category, published, url, tags) + 한국어 제목/요약 + 원문 링크 + 원제목
- 안전장치: 파일명 금지 문자 정리, 동명 파일 덮어쓰기 금지(`-2` 접미사), 볼트 밖 경로 차단, 중복 저장 방지(`articles.obsidian_path`), 경로 미설정 시 안내 메시지
- API: `POST /api/articles/[id]/obsidian`

### 4.3 제외 / 이후 단계
- Clerk 인증
- Cron 자동 수집 (Vercel 배포 시)
- Notion 저장 (Obsidian으로 대체되어 폐기)

## 5. 기술 스택
| 구분 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, `cacheComponents` 활성) |
| 스타일링 | Tailwind CSS 4 |
| DB | Neon (PostgreSQL) + Drizzle ORM |
| AI | Claude API (`@anthropic-ai/sdk`), 모델 `claude-haiku-5-5` |
| RSS | rss-parser |
| 검증 | zod |

## 6. 데이터 모델 — `articles`
| 컬럼 | 설명 |
|---|---|
| id | PK |
| guid | RSS guid (unique) |
| source / title / link / author / published_at | 원본 메타데이터 (author는 RSS `dc:creator`, 없으면 null) |
| title_ko / summary_ko / category | Claude 처리 결과 |
| obsidian_path | 저장된 노트의 볼트 기준 상대 경로 (null이면 미저장) |
| created_at | 수집 시각 |

## 7. 주요 흐름
1. 사용자가 "새 기사 수집" 클릭 → RSS 병렬 수집
2. DB에 없는 guid만 추려 최대 15건을 Claude로 처리(동시 4개)
3. 결과를 DB에 저장 → 화면 새로고침
4. 사용자가 카드에서 "Obsidian에 저장" 클릭 → 노트 생성, `obsidian_path` 기록, "저장됨" 배지 표시

## 8. 비기능 요구사항
- 비밀 값(`ANTHROPIC_API_KEY`, `DATABASE_URL`)은 `.env.local`에만 두고 커밋·채팅에 노출하지 않는다 (`.env.example` 제공).
- 수집 API는 `maxDuration` 300초. 한 번에 처리량을 제한해 API 비용과 타임아웃을 통제한다.
- 개별 실패(피드, 기사 처리)가 전체 작업을 중단시키지 않는다.

## 9. 환경 변수
| 변수 | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | (사용자 입력 필요) |
| `DATABASE_URL` | Neon 접속 문자열 (사용자 입력 필요) |
| `OBSIDIAN_VAULT_PATH` | `C:\31.AI_PJT\03.Obsidian_260920\HDsObsidian` |
| `OBSIDIAN_NEWS_FOLDER` | `8.Archive (기록)/13. Test` |

## 10. 성공 기준
- 수집 버튼 1회로 한국어 카드가 표시된다.
- 즉시 재수집 시 새로 저장되는 기사가 0건이다.
- 피드 하나가 실패해도 나머지가 수집된다.
- 저장 버튼으로 `13. Test` 폴더에 올바른 노트가 생기고, 같은 기사를 다시 저장해도 파일이 늘지 않는다.
- `npx tsc --noEmit`, `npm run build` 통과.

## 11. 현재 상태와 남은 일
- [x] 프로젝트 스캐폴딩, MVP 코드, 빌드 통과 (Obsidian 추가 전 시점)
- [x] Obsidian 저장 코드 작성 (`schema.ts`, `lib/obsidian.ts`, 저장 API, `SaveButton`, `ArticleCard` 수정)
- [x] 볼트 경로 확인 및 `.env.local`, `.env.example`에 반영 (API 키/DB URL은 빈 값)
- [x] README에 Obsidian 항목 추가
- [x] Obsidian 코드 추가 후 타입 검사·lint·빌드 재확인 (2026-10-17 통과)
- [x] Neon DB 생성, `DATABASE_URL`/`ANTHROPIC_API_KEY` 입력, `obsidian_path` 컬럼 반영
- [x] 실제 키/DB/볼트로 end-to-end 검증 (수집 15건 저장, Obsidian 노트 생성, 중복 저장 방지 확인)
- [x] 수집 버튼에 처리 실패 건수·원인 안내 표시 (`CollectButton`)
- [x] 즉시 재수집 시 신규 0건인지 확인 (2026-10-24: 3회 연속 호출 → 15건 → 5건(이월분) → 0건, 중복 20건 스킵)
- [ ] 일지 기록 및 `/skill-harvest`

검증 중 발견한 사항: `cacheComponents`가 켜져 있으면 라우트의 `export const runtime = ...`는 빌드 에러가 난다 (Node 런타임이 기본값이라 불필요). API 크레딧이 없으면 모든 기사 처리가 실패하고 0건 저장으로 보인다.

## 12. 리스크
- Obsidian 직접 쓰기는 로컬 전용이라 서버리스 배포와 양립하지 않는다 (배포 시 REST API 방식 재검토).
- RSS 피드 URL이 바뀌거나 막힐 수 있다 (`src/lib/rss.ts`의 `FEEDS`에서 관리).
- LLM 출력 형식 오류는 zod 검증 실패로 해당 기사만 건너뛴다.
- 테스트 폴더(`13. Test`)에 저장하므로, 운영용으로 쓸 때는 `OBSIDIAN_NEWS_FOLDER`만 바꾸면 된다.
