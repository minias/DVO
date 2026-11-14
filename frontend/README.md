# DVO 프론트엔드

주사위 턴제 보드 RPG 의 웹 클라이언트. 화면, 입력, 캔버스 연출을 맡는다. 게임 데이터 저장과 검증은 백엔드(`../backend`)가 맡는다.

## 기술 스택

SvelteKit 2 이상 + Svelte 5(Runes), TypeScript, Tailwind CSS 4, Vite, Vitest(서버·브라우저), Paraglide(ko/en), Canvas2D.

## 실행 방법

Node 22 이상이 필요하다(루트 `.nvmrc` 참고).

```bash
cd frontend
npm install
npm run dev        # 개발 서버 (브라우저 자동 실행)
```

## 자주 쓰는 명령

| 명령                   | 설명                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | 개발 서버                                                   |
| `npm run build`        | 프로덕션 빌드                                               |
| `npm run preview`      | 빌드 결과 미리보기                                          |
| `npm run check`        | 번역 컴파일, 동기화, 타입 검사                              |
| `npm run lint`         | prettier 서식 검사와 eslint                                 |
| `npm run format`       | prettier 로 서식 정리                                       |
| `npm run test:server`  | 서버 프로젝트 단위 테스트(브라우저 불필요)                  |
| `npm test`             | 전체 테스트(브라우저 테스트 포함, Playwright Chromium 필요) |
| `npm run verify:local` | check → lint → 서버 테스트 → build (브라우저 테스트 제외)   |
| `npm run verify`       | check → lint → 전체 테스트 → build (CI 와 동일)             |

브라우저 테스트용 Chromium 은 처음 한 번 `npx playwright install chromium` 으로 설치한다.

## 폴더 구조

```
frontend/
├─ messages/       번역 문구 (ko.json, en.json)
├─ project.inlang/ Paraglide 설정
├─ src/
│  ├─ config/      게임 수치 설정 (밸런스는 이 폴더만 수정)
│  ├─ game/        순수 게임 로직과 캔버스 렌더러
│  │  ├─ board/ dice/ player/ session/ ...   보드, 주사위, 턴·이동 상태, 타일 이벤트·전투
│  │  └─ renderers/                          캔버스 그리기와 연출
│  ├─ lib/         UI 컴포넌트 (상태창, 액션 바, 언어 전환, 캔버스 래퍼)
│  └─ routes/      SvelteKit 페이지
└─ static/         정적 파일
```

- 순수 로직(`src/game/**`)은 DOM 과 DB 를 모른다. 설정 객체만 주입받아 단위 테스트로 검증한다.
- 게임 수치(`src/config/*.config.ts`)는 기본값이다. 백엔드 연동 후에는 서버 응답이 이 값을 덮어쓰고, 서버가 없으면 기본값으로 동작한다.

## 규칙

- Svelte 5 Runes(`$state`, `$derived`, `$effect`)만 사용한다. Svelte 4 스토어는 쓰지 않는다.
- API 주소는 코드에 직접 쓰지 않고 `VITE_API_BASE_URL` 환경변수에서 읽는다(`src/lib/api/http.ts`, 백엔드 연동 시 추가).
- 사람이 읽는 주석은 한국어로 쓴다.
- 커밋 전에 `npm run verify:local`(또는 `npm run verify`)을 통과시킨다.

## 다국어

- 문구는 `messages/ko.json`, `messages/en.json` 에 키(`snake_case`)로 추가한다.
- 코드에서는 `$lib/paraglide/messages` 의 함수로 호출한다. 번역 코드는 `npm run check`, `npm run dev`, `npm run build` 때 자동 생성된다(커밋하지 않음).
- 보드 타일 이름은 `board_tile_*` 키로 번역한다.
