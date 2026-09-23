# ProcureAI

공공조달 문서의 요구사항, 원문 근거, 제안서 대응 관계와 누락을 검토하는 Proposal Intelligence Platform MVP입니다.

## 구현 범위

- Projects 생성 및 목록
- Documents 업로드, 분류, Original/Extracted 검토 화면
- Requirement Matrix 검색, 필터, 상세 drawer, 수동 상태 변경
- Proposal 업로드와 섹션별 대응 현황
- Critical/Major/Minor Review Issue
- 브라우저 localStorage demo adapter
- Supabase PostgreSQL schema, tenant RLS, private PDF Storage 정책

## 실행 및 검증

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

환경 변수는 `.env.example`을 참고해 Git에서 제외된 `.env.local`에 설정합니다. `OPENAI_API_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`는 server-only입니다.

## 구조

```text
src/app                 Next.js App Router
src/components          shell, provider, 공통 UI
src/features            업무 화면
src/lib                 domain, demo data, Supabase clients
supabase/migrations     schema, RLS, Storage policy
```

현재는 자격증명 없이도 demo 흐름을 확인할 수 있습니다. 실제 연결 순서는 Supabase migration 적용 → Auth/Organization onboarding → DB repository 교체 → PDF 페이지 추출 → structured requirement extraction → proposal candidate retrieval 및 조건 검증입니다.
