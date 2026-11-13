# DiceVerse Online

> 온라인 멀티플레이 보드 RPG (Board MMORPG)

## 프로젝트 개요

DiceVerse Online은 전통적인 실시간 MMORPG가 아닌, **주사위 기반 턴제 보드 RPG**를 목표로 합니다.

플레이어는 보드 위를 이동하며 성장하고, 장비를 획득하고, 몬스터를 처치하며, 다른 플레이어와 협력 또는 경쟁할 수 있습니다.

![v0.0.1](./docs/img/v0.0.1.PNG)

---

## 현재 상태 (v0.0.1)

| 영역                                    | 상태                                              |
| --------------------------------------- | ------------------------------------------------- |
| 보드 생성 (10×10 외곽 36칸)             | ✅ 구현                                           |
| 캔버스 렌더링 (타일·영웅)               | ✅ 구현                                           |
| 키보드 입력 매니저 (Space = 굴리기)     | ✅ 구현                                           |
| 설정 파일 (board/dice/game/i18n/player) | ✅ 구현                                           |
| 다국어 기반 (paraglide, ko/en)          | 🔧 기반 + UI 문구 키 구성, 언어 전환 UI 는 미구현 |
| 주사위 굴리기 로직                      | ✅ 구현 (M1)                                      |
| 턴·이동 상태, 이동 연출                 | ✅ 구현 (M2, 브라우저 확인 필요)                  |
| 상태창 (HP/MP/GOLD)                     | ✅ 구현 (M3, 표시만. 변화 규칙은 M5)              |
| 이벤트·전투 타일 동작                   | ⬜ 타일 종류만 정의                               |
| 테스트                                  | 🔧 순수 로직 단위 테스트 20개                     |
| 백엔드 / DB / Redis                     | ⬜ 계획 단계                                      |

---

## 핵심 컨셉

### 기존 MMORPG

- 실시간 이동
- 실시간 전투
- 높은 서버 부하
- 복잡한 동기화

### DiceVerse Online

- 주사위 기반 턴 진행
- 보드 이동
- 이벤트 중심 게임 플레이
- 낮은 서버 부하
- 모바일/웹 친화적

---

## MVP 목표

### 포함

- 보드 맵
- 플레이어 이동
- 주사위 시스템
- 상태창
- 이벤트 타일
- 다국어 지원
- 반응형 웹 UI

### 제외

- 로그인
- 길드
- 거래소
- PvP
- WebSocket
- 실시간 멀티플레이

---

# 기술 스택

## Frontend (현재)

- SvelteKit 2 / Svelte 5 (Runes)
- TypeScript
- Tailwind CSS 4
- Paraglide (다국어, `@inlang/paraglide-js`)
- Canvas 2D 렌더링
- Vite 8 / Vitest / ESLint / Prettier

## Backend (향후)

- Golang
- REST API
- WebSocket

## Database (향후)

- MariaDB

## Cache (향후)

- Redis

---

# 프로젝트 구조

```text
DVO
├─ messages/                 # 다국어 메시지 (ko.json, en.json)
├─ project.inlang/           # paraglide 설정
├─ static/
├─ docs/                     # 문서, 이미지
└─ src/
   ├─ app.html
   ├─ hooks.ts / hooks.server.ts   # paraglide 라우팅 훅
   ├─ config/                # 모든 수치 설정 (Config First)
   │   ├─ game.config.ts
   │   ├─ board.config.ts
   │   ├─ dice.config.ts
   │   └─ i18n.config.ts
   ├─ game/                  # 프레임워크 비의존 게임 로직
   │   ├─ main.ts
   │   ├─ core/              # 렌더러 인터페이스
   │   ├─ board/             # 보드 모델 / 타일 데이터 / 생성기
   │   ├─ entities/          # 영웅 등 엔티티
   │   ├─ input/             # 키보드 입력 매니저
   │   ├─ renderers/         # Canvas 렌더러
   │   └─ world/             # 월드 상태, 영웅 팩토리
   ├─ lib/
   │   └─ game/GameCanvas.svelte   # 캔버스 마운트 컴포넌트
   └─ routes/
       ├─ +layout.svelte
       ├─ +page.svelte
       └─ layout.css
```

경로 별칭: `$config` → `src/config`, `$game` → `src/game`, `$lib` → `src/lib`

> 향후 추가 예정: `lib/player`(상태창), `lib/action`(주사위 버튼), `lib/layout`, 서비스(`dice`, `board`), 상태 관리(Svelte 5 Runes 기반).

---

# 게임 설정

## GAME_CONFIG

- 앱 이름, 버전, 디버그 여부

## BOARD_CONFIG

- 타일 크기(`TILE_SIZE`), 오프셋, 한 변의 타일 수(`EDGE_COUNT`), 그리드 표시 여부
- 현재 `EDGE_COUNT = 10` → 외곽 36칸 (`4 × (10 - 1)`)
- 타일 종류와 이름은 `src/game/board/board.data.ts` 에서 데이터로 관리

## DICE_CONFIG

- 기본 주사위 개수(`DEFAULT_COUNT`), 최소값(`MIN`), 최대값(`MAX`)

## I18N_CONFIG

- 기본 언어(`ko`), 지원 언어 목록(`ko`, `en`)

---

# 주사위 시스템

초기 설정

```typescript
{
    DEFAULT_COUNT: 2,
    MIN: 1,
    MAX: 6
}
```

결과 예시

```text
3 + 5 = 8
```

향후 (4개)

```text
2 + 6 + 4 + 1 = 13
```

코드 수정 없이 설정만 변경 가능해야 한다.

---

# 보드

## 타일 종류

`START`, `CITY`, `EVENT`, `BATTLE`, `BOSS`, `JAIL`

## 형태 (10×10 외곽, 36칸)

한 변에 10칸이며, 모서리 칸은 인접한 두 변이 공유합니다.

```text
01 02 03 04 05 06 07 08 09 10
36                         11
35                         12
34                         13
33                         14
32                         15
31                         16
30                         17
29                         18
28 27 26 25 24 23 22 21 20 19
```

---

# 다국어 지원

## 지원 언어

### 현재

- 한국어 (기본)
- 영어

### 향후

- 일본어
- 중국어 간체
- 중국어 번체

## 번역 라이브러리

- Paraglide (`@inlang/paraglide-js`) — 메시지는 `messages/{locale}.json`

## 번역 키 규칙

Paraglide 는 메시지 키를 JS 함수 이름으로 만들기 때문에 점(`.`) 대신 snake_case 를 사용합니다.

```text
ui_*  action_*  board_*  monster_*  item_*  quest_*  npc_*  system_*
```

예시

```text
ui_title
action_roll_dice
board_start
monster_slime_name
item_potion_name
```

사용 방법

```typescript
import { m } from '$lib/paraglide/messages';

m.action_roll_dice();
m.ui_turn({ turn: 3 });
```

---

# UI 구조

```text
┌─────────────────────────────┐
│ DiceVerse Online            │
├─────────────────────────────┤
│                             │
│          Board              │
│                             │
├─────────────────────────────┤
│ HP | MP | GOLD              │
├─────────────────────────────┤
│ 🎲 | ⚔ | 🎒                │
└─────────────────────────────┘
```

---

# 개발 원칙

## 1. Config First

모든 수치는 `src/config` 에서 관리한다. (HP, MP, GOLD, 주사위 개수, 보드 크기, 경험치, 몬스터 능력치 등)

## 2. Data Driven

게임 로직은 데이터 중심으로 설계한다.

```json
{
	"id": 1,
	"type": "monster",
	"monsterId": "slime"
}
```

## 3. Translation Key Only

화면에 직접 문자열을 사용하지 않는다. (현재 `board.data.ts` 의 타일 이름은 임시 하드코딩 → 번역 키로 이전 예정)

금지

```typescript
'공격';
```

허용

```typescript
'action.attack';
```

## 4. Svelte 5 Runes Only

상태는 `$state`, `$derived`, `$effect` 로 관리하고, Svelte 4 스토어는 사용하지 않는다.

## 5. Future MMORPG Ready

향후 추가 예정: 로그인, WebSocket, 멀티플레이, 파티, 길드, 거래소, PvP, 시즌 시스템

---

# 개발 환경

## 지원 환경

**Windows / macOS / Linux 의 최신 Chrome** 에서 동작하는 것을 목표로 합니다. 웹게임의 실행 환경은 OS 가 아니라 브라우저이므로, CI(`.github/workflows/ci.yml`)는 Linux 한 곳에서 전체 검증 게이트와 Chromium 브라우저 스모크 테스트(`src/routes/page.svelte.test.ts`)를 실행합니다.

OS 에 따라 달라질 수 있는 렌더링 요소는 설정으로 관리합니다 (`src/config/render.config.ts`).

- 캔버스 글꼴: OS 별 한글 폰트 폴백 스택 (`FONT_FAMILY`)
- 고해상도 화면: `devicePixelRatio` 반영 (`MAX_DEVICE_PIXEL_RATIO`)

개발 환경은 Windows / macOS / Linux 모두 사용할 수 있습니다.

| 항목            | 요구 사항                                                          |
| --------------- | ------------------------------------------------------------------ |
| Node.js         | `^20.19` / `^22.13` / `>=24` (권장 22, `.nvmrc`)                   |
| 줄바꿈          | 저장소는 LF 로 통일 (`.gitattributes`, `.editorconfig`)            |
| 파일 경로       | 항상 `/` 와 상대 경로·별칭(`$game`, `$config`) 사용, 대소문자 일치 |
| 브라우저 테스트 | 최초 1회 `npx playwright install chromium`                         |

> `DVO-CreateFolders.ps1` 은 초기 폴더 생성용 Windows 전용 스크립트이며 현재 구조에는 필요하지 않습니다.

## 명령어

```bash
npm install        # 의존성 설치 (CI 에서는 npm ci)
npm run dev        # 개발 서버 (http://localhost:5173)
npm run check      # 타입 검사 (svelte-check)
npm run build      # 프로덕션 빌드
npm run lint       # prettier + eslint
npm test           # 단위 테스트 (vitest)
npm run verify     # check → lint → test → build 전체 게이트
```

---

# 첫 번째 마일스톤

## MVP-001

구현 목표

- 보드 렌더링 ✅
- 플레이어 렌더링 ✅
- 주사위 굴리기 ✅
- 이동 ✅
- 상태창 ✅
- 다국어 전환 ⬜

완료 기준

브라우저에서 플레이어가 주사위를 굴리고 보드 위를 이동할 수 있어야 한다.
