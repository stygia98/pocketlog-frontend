# moneylog-frontend 개발 가이드

> 이 저장소를 단독으로 클론하면 부모 문서(`moneylog-project/CLAUDE.md`)가 없다.
> **전체 스펙(API 명세·화면 설계·상태 관리 규칙 등)은 그 문서가 정본이다.**
> 여기에는 **이 저장소에서만** 참조하는 빌드 명령과 계층 규칙만 적는다.

> `AGENTS.md`는 `next dev`가 자동 생성하는 별개 파일이다(Next.js 버전 차이 경고). 이 문서와 무관하며, 재생성되므로 지우지 않는다.

## 실행 명령어

```bash
npm install --legacy-peer-deps    # shadcn/ui가 peer dependency 충돌을 일으킨다
npm run dev                       # http://localhost:3000
npm run build
npm run lint
```

- 실행 전 `.env.example`을 참고해 `.env.local`을 채운다.
- **`Next.js는 15를 쓴다. 16을 쓰지 않는다.`** `npm install next@latest`처럼 버전을 임의로 올리지 않는다(부모 `CLAUDE.md` 3장).
- `next --version`으로 15.x인지 수시로 확인한다.

### shadcn/ui 스타일 (부모 `CLAUDE.md`의 "new-york" 지시에 대한 예외)

**shadcn CLI 4.21.0부터 "new-york"/"default" 스타일 체계가 사라지고 `--base`(base/radix/aria)·`--preset` 체계로 바뀌었다.**
`--style` 플래그 자체가 없어졌으므로 "new-york"을 지정할 방법이 없다. 이 저장소는 이미 설치된 **`base-nova` preset(`components.json`의 `"style": "radix-nova"`)을 그대로 쓴다.**
`globals.css`가 `shadcn/tailwind.css`를 import하는 것도 이 신버전 아키텍처의 정상 동작이다(런타임 의존성 `shadcn` 패키지가 필요한 이유).

## 디렉토리 계층 규칙

```
src/
├── app/          # App Router. 모든 page.tsx에 "use client" (루트 layout.tsx만 예외)
├── components/
│   ├── ui/       # shadcn/ui
│   ├── common/   # Pagination, EmptyState, ErrorState, Skeleton
│   ├── chart/    # 화면은 이 안의 컴포넌트만 알고 SVG인지 Recharts인지 모른다
│   └── transaction/
├── hooks/
├── lib/          # apiClient, queryClient, money, date, queryKeys, errorMessages
└── types/
```

- **금액 포맷·파싱은 `lib/money.ts`, 날짜 포맷은 `lib/date.ts`만 쓴다.** 화면에서 `toLocaleString`·`format`을 직접 부르지 않는다.
- 서버 상태는 React Query, UI 상태만 `useState`.
- `any` 금지. 불가피하면 `unknown` + 타입 가드.

## 이 저장소에서 설치하지 않는 것

`recharts` · `react-hook-form` · `zod` · `@hookform/resolvers` · `framer-motion`(→ `motion`으로 대체) · `opencsv`류. 이유는 부모 `CLAUDE.md` 3장 참조.

## 영수증 OCR (`TXN-13`)

`tesseract.js`는 이 원칙의 유일한 예외다 — OCR은 직접 구현할 수 있는 종류의 일이 아니다. 인식은 **전부 브라우저에서** 끝나고(`lib/receipts.ts`), 백엔드 엔드포인트도 외부 API 키도 쓰지 않는다. 최초 1회 언어 데이터(kor+eng)만 CDN에서 받아 IndexedDB에 캐시한다.

> ⚠️ **순수 OCR이라 사진 품질에 정확도가 크게 좌우된다.** 배경이 섞이거나 기울어진 사진은 레이아웃 분석이 무너져 거의 못 읽는다. 알고리즘으로 보정하는 대신 퀵 입력 바의 촬영 안내 문구로 대응하기로 했다.

## 테스트

이 프로젝트는 자동화된 E2E 테스트 도구(Playwright 등)를 쓰지 않는다. 화면 검증은 `ROADMAP.md` 각 Phase의 DoD 체크리스트를 수동으로 확인하는 방식이다.
