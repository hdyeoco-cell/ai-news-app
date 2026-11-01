# UI 가이드 (ui.md)

AI 뉴스 수집기의 화면 구성과 Tailwind CSS 스타일 규칙이다. 새 UI를 만들거나 고칠 때 이 문서를 기준으로 삼는다.
현재 코드(`src/app/page.tsx`, `src/components/*`)에서 쓰는 클래스를 기준으로 정리했고, "추가 버튼"처럼 아직 구현되지 않은 부분은 **(신규)** 로 표시한다.

## 1. 디자인 원칙
- **깔끔함**: 장식을 줄이고 여백과 얇은 테두리로 영역을 나눈다. 그림자는 `shadow-sm` 이상 쓰지 않는다.
- **읽기 편함**: 본문은 `leading-relaxed`, 제목은 `leading-snug`. 본문 글자색은 순검정 대신 `zinc-600`/`zinc-400`.
- **강조색은 하나**: 파란색(`blue-600`)만 주 강조색이다. 보라색(`violet`)은 "Obsidian 저장됨" 상태 전용.
- **다크 모드**: 모든 색 클래스에 `dark:` 짝을 둔다. 배경/글자색은 `globals.css`의 CSS 변수(`--background`, `--foreground`)가 `prefers-color-scheme`으로 전환한다.
- **한국어 우선**: 모든 UI 문구는 한국어.

## 2. 색상 토큰

| 용도 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `--background` (#fff) | `--background` (#0a0a0a) |
| 카드 배경 | `bg-white` | `dark:bg-zinc-900` |
| 카드 테두리 | `border-zinc-200` | `dark:border-zinc-800` |
| 본문 글자 | `text-zinc-600` | `dark:text-zinc-400` |
| 보조 글자(메타) | `text-zinc-500` | 동일 |
| 주 강조(버튼, 활성 탭, 링크) | `bg-blue-600` / `text-blue-600` | 동일 |
| 카테고리 뱃지 | `bg-blue-100 text-blue-700` | `dark:bg-blue-950 dark:text-blue-300` |
| 저장됨 뱃지 | `bg-violet-100 text-violet-700` | `dark:bg-violet-950 dark:text-violet-300` |
| 오류 메시지 | `text-red-600` | 동일 |

## 3. 타이포그래피

| 요소 | 클래스 |
|---|---|
| 페이지 제목 | `text-2xl font-bold` |
| 카드 제목 | `text-lg font-semibold leading-snug` |
| 카드 요약 | `text-sm leading-relaxed` |
| 메타(출처·날짜) | `text-xs text-zinc-500` |
| 버튼/탭 글자 | `text-sm font-medium` |

## 4. 페이지 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ AI 뉴스 수집기                [새 기사 수집] [👤]    │  ← 헤더
├──────────────────────────────────────────────────────┤
│ (전체) 로보틱스 LLM/생성AI … 기타  [+ 추가]          │  ← 카테고리 바 (신규: 추가 버튼)
├──────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐                     │
│ │ 카드   │ │ 카드   │ │ 카드   │                     │  ← 뉴스 카드 목록
│ └────────┘ └────────┘ └────────┘                     │
└──────────────────────────────────────────────────────┘
```

- 컨테이너: `<main className="mx-auto max-w-6xl px-4 py-8">`
- 헤더: `mb-6 flex flex-wrap items-center justify-between gap-4` (좁은 화면에서 줄바꿈)
- 로그인 상태에 따라 헤더 우측이 바뀐다. 로그인: `CollectButton` + `UserButton`, 비로그인: 로그인/가입 버튼.
- 대시보드(`/dashboard`) 헤더에는 `← 전체 목록` 옆에 `FetchNewsButton`("뉴스 가져오기")이 `UserButton` 앞에 놓인다. 스타일은 7절 주 버튼과 같다.
- 비로그인이면 카테고리 바와 카드 목록 대신 `SignInGate`가 렌더된다.

## 5. 카테고리 바 (뉴스 카드 목록 바로 위)

카테고리는 `lib/categories.ts`의 `CATEGORIES`가 단일 출처이며, 맨 앞에 "전체"를 붙여 가로로 나열한다. 선택 상태는 URL(`/?category=`)로 관리해 서버 컴포넌트가 필터링한다.

```tsx
<nav className="mb-6 flex flex-wrap items-center gap-2">
  <Link href="/" className={tab(!category)}>전체</Link>
  {CATEGORIES.map((c) => (
    <Link key={c} href={`/?category=${encodeURIComponent(c)}`} className={tab(category === c)}>
      {c}
    </Link>
  ))}
  <AddCategoryButton /> {/* (신규) 카테고리 맨 끝 */}
</nav>
```

탭 스타일(`page.tsx`의 `tab()` 헬퍼):

| 상태 | 클래스 |
|---|---|
| 활성 | `rounded-full px-3 py-1 text-sm bg-blue-600 text-white` |
| 비활성 | `rounded-full px-3 py-1 text-sm bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300` |

규칙:
- 탭은 항상 알약(`rounded-full`) 모양, 같은 높이. 활성 탭은 파란 채움 하나뿐이다.
- 탭이 많아 한 줄을 넘으면 `flex-wrap`으로 줄바꿈한다 (가로 스크롤 쓰지 않음).

### 5.1 추가 버튼 (신규)
카테고리 목록의 **가장 끝**에 놓는 버튼. 탭과 같은 크기·모양이되, 점선 테두리로 "탭이 아닌 동작"임을 구분한다.

```tsx
<button
  type="button"
  aria-label="카테고리 추가"
  className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-sm text-zinc-500
             hover:border-blue-500 hover:text-blue-600
             dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-400 dark:hover:text-blue-400"
>
  + 추가
</button>
```

- 클릭 시 동작(입력 모달/인라인 입력 등)은 구현 단계에서 정한다. 이 문서는 위치와 모양만 규정한다.
- 주의: 현재 카테고리 7종은 프롬프트·검증·탭이 `CATEGORIES` 하나를 공유한다. 사용자 정의 카테고리를 허용하려면 `lib/claude.ts`의 분류 프롬프트와 zod 검증까지 함께 바꿔야 하므로, 동작을 붙이기 전에 범위를 확인한다.

## 6. 뉴스 카드

`src/components/ArticleCard.tsx` 기준.

```
┌──────────────────────────────────┐
│ [카테고리]        출처 · 날짜    │  ← 메타 행
│ 한국어 제목 (text-lg, semibold)  │
│ 3~4문장 요약 (text-sm, relaxed)  │
│ 원문 보기 →        [Obsidian 저장]│  ← 액션 행 (mt-auto로 하단 고정)
└──────────────────────────────────┘
```

- 컨테이너: `flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- 카테고리 뱃지: `rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300`
- 원문 링크: `text-sm font-medium text-blue-600 hover:underline`, `target="_blank" rel="noopener noreferrer"` 필수.
- 저장 상태: 저장 전엔 `SaveButton`, 저장 후엔 보라색 "Obsidian 저장됨" 뱃지(`title`에 볼트 상대 경로).
- 카드 높이가 달라도 액션 행이 맞도록 `mt-auto`를 쓴다.

### 카드 그리드
`grid gap-4 sm:grid-cols-2 lg:grid-cols-3` — 모바일 1열, `sm` 2열, `lg` 3열.

### 페이지 나누기
`src/components/Pagination.tsx`. 대시보드는 한 페이지에 카드 **9개**(`PAGE_SIZE`)씩 보여주고, `?page=N`으로 이동한다(1페이지는 쿼리 없음).
- 위치: 카드 그리드 아래 `mt-8`, 가운데 정렬. `이전` · 페이지 번호 · `다음`.
- 스타일: 탭(5절)과 같은 알약. 현재 페이지는 `bg-blue-600 text-white` + `aria-current="page"`, 첫/끝 페이지에서 이전/다음은 `opacity-50` 비활성.
- 번호는 현재 페이지 앞뒤 2개 + 처음/끝만 보이고 사이는 `…`.
- 범위를 벗어났거나 잘못된 `page` 값은 가장 가까운 유효 페이지로 보정한다. 페이지가 1개뿐이면 렌더하지 않는다.

## 7. 버튼

| 종류 | 클래스 |
|---|---|
| 주 버튼 (수집) | `rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50` |
| 탭 / 알약 | 5절 참고 |
| 추가 버튼 | 5.1절 참고 |

- 진행 중에는 `disabled`로 막고 문구를 바꾼다 (예: "수집·번역 중...").
- 결과 메시지는 버튼 왼쪽에 `text-sm`으로 표시, 실패는 `text-red-600`, 성공은 `text-zinc-500`.

## 8. 상태 화면
- 로딩: `py-20 text-center text-zinc-500` — "불러오는 중..." (`<Suspense fallback>`)
- 빈 목록: 같은 스타일로 "기사가 없습니다. '새 기사 수집' 버튼을 눌러보세요."
- 비로그인: `SignInGate` (로그인 모달 자동 표시)

## 9. 접근성·반응형 체크리스트
- 아이콘만 있는 버튼은 `aria-label`을 단다.
- 외부 링크는 `rel="noopener noreferrer"`.
- 활성 탭과 비활성 탭은 색만이 아니라 채움 유무로도 구분된다 (명도 대비 확보).
- 모바일(<640px)에서 가로 스크롤이 생기지 않아야 한다. 긴 제목은 줄바꿈된다.
- 새 색을 추가하기 전에 2절 표에 맞는 토큰이 있는지 먼저 본다.
