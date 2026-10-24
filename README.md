# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 수집하고 Claude가 한국어 번역/요약/카테고리 분류를 해서 카드로 보여주는 앱 (핵심 MVP).

## 실행
1. `.env.example`을 `.env.local`로 복사하고 `ANTHROPIC_API_KEY`, `DATABASE_URL`(Neon)을 채운다.
2. `npx drizzle-kit push` 로 테이블 생성
3. `npm run dev` 후 http://localhost:3000 에서 "새 기사 수집" 클릭

## Obsidian 저장
카드의 "Obsidian에 저장" 버튼이 기사를 마크다운 노트로 볼트에 기록한다 (로컬 실행 전용).
`.env.local`에 `OBSIDIAN_VAULT_PATH`(볼트 경로), `OBSIDIAN_NEWS_FOLDER`(볼트 기준 저장 폴더)를 설정한다.

## 이후 단계
Clerk 인증, 자동 수집(Cron)
