# DiceVerse Online

> 온라인 멀티플레이 보드 RPG (Board MMORPG)

## 프로젝트 개요

DiceVerse Online은 전통적인 실시간 MMORPG가 아닌, **주사위 기반 턴제 보드 RPG**를 목표로 합니다.

플레이어는 보드 위를 이동하며 성장하고, 장비를 획득하고, 몬스터를 처치하며, 다른 플레이어와 협력 또는 경쟁할 수 있습니다.

---

## 핵심 컨셉

### 기존 MMORPG

* 실시간 이동
* 실시간 전투
* 높은 서버 부하
* 복잡한 동기화

### DiceVerse Online

* 주사위 기반 턴 진행
* 보드 이동
* 이벤트 중심 게임 플레이
* 낮은 서버 부하
* 모바일/웹 친화적

---

## MVP 목표

### 포함

* 보드 맵
* 플레이어 이동
* 주사위 시스템
* 상태창
* 이벤트 타일
* 다국어 지원
* 반응형 웹 UI

### 제외

* 로그인
* 길드
* 거래소
* PvP
* WebSocket
* 실시간 멀티플레이

---

# 기술 스택

## Frontend

* SvelteKit
* TypeScript
* svelte-i18n

## Backend (향후)

* Golang
* REST API
* WebSocket

## Database

* MariaDB

## Cache

* Redis

---

# 프로젝트 구조

```text
diceverse-online

├── src
│
├── config
│   ├── game.config.ts
│   ├── board.config.ts
│   ├── dice.config.ts
│   └── i18n.config.ts
│
├── types
│   ├── game.type.ts
│   ├── board.type.ts
│   ├── player.type.ts
│   └── i18n.type.ts
│
├── stores
│   ├── game.store.ts
│   ├── player.store.ts
│   └── board.store.ts
│
├── locales
│   ├── ko
│   │   ├── ui.json
│   │   ├── board.json
│   │   ├── monster.json
│   │   ├── item.json
│   │   └── system.json
│   │
│   └── en
│       ├── ui.json
│       ├── board.json
│       ├── monster.json
│       ├── item.json
│       └── system.json
│
├── i18n
│   └── index.ts
│
├── lib
│   ├── components
│   │
│   ├── board
│   │   ├── Board.svelte
│   │   ├── Tile.svelte
│   │   └── Hero.svelte
│   │
│   ├── player
│   │   ├── StatusBar.svelte
│   │   └── PlayerCard.svelte
│   │
│   ├── action
│   │   ├── ActionBar.svelte
│   │   └── DiceButton.svelte
│   │
│   └── layout
│       ├── Header.svelte
│       └── Footer.svelte
│
├── services
│   ├── dice.service.ts
│   └── board.service.ts
│
├── routes
│   └── +page.svelte
│
└── app.html
```

---

# 게임 설정

## GameConfig

```typescript
GAME_CONFIG
```

담당 항목

* 게임명
* 버전
* 언어 설정
* 환경 설정

---

## BoardConfig

```typescript
BOARD_CONFIG
```

담당 항목

* 보드 크기
* 타일 개수
* 맵 테마

---

## DiceConfig

```typescript
DICE_CONFIG
```

담당 항목

* 기본 주사위 개수
* 최소값
* 최대값
* 면 수

---

# 주사위 시스템

초기 설정

```typescript
{
    count: 2,
    sides: 6
}
```

결과 예시

```text
3 + 5 = 8
```

향후

```typescript
{
    count: 4,
    sides: 6
}
```

결과 예시

```text
2 + 6 + 4 + 1 = 13
```

코드 수정 없이 설정만 변경 가능해야 한다.

---

# 다국어 지원

## 지원 언어

### 현재

* 한국어 (기본)
* 영어

### 향후

* 일본어
* 중국어 간체
* 중국어 번체

---

## 번역 라이브러리

* svelte-i18n

---

## 번역 키 규칙

```text
ui.*

action.*

board.*

monster.*

item.*

quest.*

npc.*

system.*
```

예시

```text
ui.title

action.rollDice

board.start

monster.slime.name

item.potion.name
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

# 보드 형태

초기 MVP

```text
01 02 03 04 05 06 07 08
32                   09
31                   10
30                   11
29                   12
28 27 26 25 24 23 22 13
```

---

# 개발 원칙

## 1. Config First

모든 수치는 Config에서 관리한다.

예시

* HP
* MP
* GOLD
* Dice Count
* Board Size
* Experience
* Monster Stats

---

## 2. Data Driven

게임 로직은 데이터 중심으로 설계한다.

예시

```json
{
  "id": 1,
  "type": "monster",
  "monsterId": "slime"
}
```

---

## 3. Translation Key Only

화면에 직접 문자열을 사용하지 않는다.

금지

```typescript
'공격'
```

허용

```typescript
'action.attack'
```

---

## 4. Future MMORPG Ready

향후 추가 예정

* 로그인
* WebSocket
* 멀티플레이
* 파티
* 길드
* 거래소
* PvP
* 시즌 시스템

---

# 프로젝트 생성

```bash
npm create svelte@latest diceverse-online
```

선택

```text
Skeleton Project
TypeScript
ESLint
Prettier
```

설치

```bash
cd diceverse-online

npm install

npm install svelte-i18n
```

실행

```bash
npm run dev
```

접속

```text
http://localhost:5173
```

---

# 첫 번째 마일스톤

## MVP-001

구현 목표

* 보드 렌더링
* 플레이어 렌더링
* 주사위 굴리기
* 이동
* 상태창
* 다국어 전환

완료 기준

브라우저에서 플레이어가 주사위를 굴리고 보드 위를 이동할 수 있어야 한다.
