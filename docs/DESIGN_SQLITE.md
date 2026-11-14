# 설계: Go 백엔드 + SQLite 데이터 관리

> 상태: **초안**. 확정된 결정: Go 백엔드 + SQLite, **모노레포(`frontend/` + `backend/`)** (2026-11-14). 확정 목록은 8절. 코드·의존성·환경변수 변경은 단계별 승인 후 진행한다.

## 1. 목표
- 변경이 일어나는 정보(아이템, 보스·몬스터, 타일 수치, 사용자, 세이브)를 코드 상수가 아니라 **SQLite 한 곳**에서 관리한다.
- 밸런스 조정을 재배포 없이(시드·마이그레이션 갱신만으로) 할 수 있게 한다.
- CLAUDE.md 의 Multi-Infra 원칙 유지: API 주소는 `VITE_API_BASE_URL` 로만 읽는다(`frontend/src/lib/api/http.ts`).

## 2. 현재 상태 (이전 대상)
| 데이터 | 현재 위치 | 비고 |
|---|---|---|
| 몬스터·보스·이벤트·도시·감옥·스킬 수치 | `src/config/tile.config.ts` | 순수 상수 |
| 성장 규칙(레벨, 경험치, 무기 단계) | `src/config/player.config.ts` | 순수 상수 |
| 보드 타일 정의(종류, 이름 키) | `src/game/board/board.data.ts` | 번역 키는 `messages/*.json` |
| 플레이어 능력치(HP/MP/골드/레벨/경험치/무기) | 메모리(`GameSession`) | 새로고침하면 사라짐 |
| 아이템 | 아직 없음 | 신규 도메인 |

## 3. 아키텍처
```
Browser (SvelteKit)  ──HTTP/JSON──>  Go API  ──>  SQLite (파일 1개)
   VITE_API_BASE_URL                  net/http      modernc.org/sqlite
```
- 저장소 안 `backend/` 디렉터리(Go 모듈). 프론트(`frontend/`)와 독립 빌드. 구조는 3-1절 참고.
- 드라이버는 **순수 Go `modernc.org/sqlite`**(CGO 없음 → macOS·Linux·EC2 교차 빌드 단순).
- SQLite 파일 경로는 서버 환경변수 `DVO_DB_PATH`. `*.db` 는 커밋하지 않는다(기존 규칙).
- 쓰기가 한 프로세스에 모이므로 `WAL` + `busy_timeout` 설정, 커넥션은 쓰기 1개 풀.
- 배포 호환: Preset 2(Route53/EC2)는 그대로 가능. Vercel 은 프론트만 올리고 API 는 별도 호스트를 가리킨다(SQLite 파일 영속성 때문).

## 3-1. 저장소 구조 (프론트·백엔드 분리)
현재는 루트 자체가 프론트엔드(`src/`, `package.json`, `vite.config.ts` 등)라 백엔드를 둘 자리가 없다. 모노레포로 나눈다.
```
DVO/
├─ frontend/        # 기존 SvelteKit 앱 전체를 이동 (src, messages, static, package.json ...)
├─ backend/         # Go 모듈 (cmd/, internal/, migrations/, seed/)
├─ docs/            # 공용 문서
├─ .github/         # CI (frontend·backend 잡 분리, 경로 필터)
└─ README.md · LICENSE · CLAUDE.md ...   # 루트 공용 파일
```
- 이동은 `git mv` 로 이력을 보존하고, **구조 변경만 담은 단독 PR**(기능 변경 없음)로 먼저 낸다.
- 영향: CI 워크플로의 작업 경로, `CLAUDE.md`·`README`·`CONTRIBUTING` 의 명령 경로, Dependabot 디렉터리, `.gitignore`, 브랜치 보호의 필수 체크 이름(`verify (ubuntu + chromium)` 유지).
- Vercel 프리셋은 Root Directory 를 `frontend` 로 지정.
- 정책 파일(`CLAUDE.md`, `.claude/agents/*` 의 소유 파일 경로 `src/**` 등) 수정이 필요하므로 **별도 승인**을 받는다.

## 4. 스키마 (초안)
```sql
-- 정적 데이터 (운영자가 갱신, 게임은 읽기만)
CREATE TABLE tile_def (id INTEGER PRIMARY KEY, type TEXT NOT NULL, name_key TEXT NOT NULL);
CREATE TABLE foe (            -- 일반 몬스터·보스
  id TEXT PRIMARY KEY,        -- 'monster' | 'boss' ...
  hp INTEGER, attack_min INTEGER, attack_max INTEGER,
  reward_min INTEGER, reward_max INTEGER, exp INTEGER);
CREATE TABLE rule (key TEXT PRIMARY KEY, value REAL NOT NULL);  -- 이벤트·도시·감옥·스킬·성장 수치
CREATE TABLE item (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL,  -- WEAPON | POTION ...
  name_key TEXT NOT NULL, price INTEGER, effect_json TEXT);

-- 동적 데이터 (플레이어)
CREATE TABLE user (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE save (
  user_id INTEGER PRIMARY KEY REFERENCES user(id),
  hp, max_hp, mp, max_mp, gold, level, exp, weapon, position INTEGER, updated_at TEXT);
CREATE TABLE inventory (
  user_id INTEGER REFERENCES user(id), item_id TEXT REFERENCES item(id),
  qty INTEGER NOT NULL, PRIMARY KEY (user_id, item_id));
```
- 스키마 버전은 `PRAGMA user_version` + `backend/migrations/NNN_*.sql` 순차 적용.
- 시드: `backend/seed/*.sql`(현재 `tile.config.ts`·`board.data.ts` 값을 그대로 옮긴 것). 시드 값이 바뀌면 새 마이그레이션으로 만든다.
- 번역 문구는 DB 로 옮기지 않는다(`name_key` 로 `messages/*.json` 참조 유지).

## 5. API (초안, JSON)
| 메서드·경로 | 용도 |
|---|---|
| `GET /api/v1/config` | 정적 데이터 일괄(타일 정의, foe, rule, item). 앱 시작 시 1회 |
| `POST /api/v1/dev/users` | 개발용 임시 사용자 생성(인증 도입 시 제거) |
| `GET /api/v1/users/{id}/save` · `PUT` | 세이브 조회·저장 |
| `GET /api/v1/users/{id}/inventory` | 인벤토리 |
- 1차는 **인증 없는 로컬 개발용**. 인증은 10절(Google OAuth)에서 별도 승인 후 도입(HITL 5번).
- CORS 허용 출처는 환경변수로 제어.

## 6. 프론트 연동 원칙
- `src/config/*.config.ts` 는 **기본값·타입 계약**으로 남기고, 서버 응답으로 덮어쓰는 `loadGameConfig()` 를 둔다.
- 서버가 없거나 실패하면 기본값으로 동작(오프라인 폴백) → 순수 로직 단위 테스트는 그대로 유지.
- 순수 로직(`src/game/**`)은 DB 를 모른다. 주입받은 설정 객체만 사용한다.

## 7. 단계 (마일스톤 제안)
0. **S0 저장소 분리**: 루트 앱을 `frontend/` 로 이동하는 구조 전용 PR(기능 변경 없음).
1. **S1 정적 설정 읽기**: `backend/` 골격, 마이그레이션·시드, `GET /config`, 프론트 `http.ts`·`loadGameConfig`. 게임 동작 변화 없음.
2. **S2 사용자·세이브**: 사용자 생성, 세이브·불러오기, 새로고침 후 복원.
3. **S3 아이템·인벤토리**: 아이템 도메인 신설(11절 규칙).
5. **S5 Google 로그인**: 10절, 별도 승인.
4. **S4 서버 권위화(선택)**: 전투·보상 판정을 서버로 옮겨 치팅 방지. 지금은 범위 밖.

## 8. 확정된 결정 (2026-11-14)
1. 구조: 모노레포 `frontend/` + `backend/`. 분리 재검토는 다른 클라이언트 추가·팀 분리·공개 범위 차이가 생길 때(`git subtree split` 가능).
2. **FE/BE 역할 분리는 네트워크 통신으로 한다**(9절). FE 는 화면·입력·연출, BE 는 데이터·저장·검증을 맡는다.
3. 사용자 식별: **향후 Google OAuth 연동**(10절). 그 전까지 로컬 개발용 임시 사용자만 쓴다.
4. SQLite 도입 확정(`modernc.org/sqlite`, 순수 Go).
5. 아이템 종류·규칙: 11절 안으로 확정(수치는 DB 시드, 변경은 마이그레이션).
6. 남은 작업: `.gitignore` 에 `backend/*.db`, `*.db-wal`, `*.db-shm` 추가(S1), 백엔드 CI 잡(S1, `govulncheck` 게이트 여부는 S1 에서 정함).

## 9. FE/BE 통신과 역할 분리
| 구분 | 프론트엔드 | 백엔드 |
|---|---|---|
| 책임 | 렌더링, 입력, 연출, 번역(i18n), 임시 UI 상태 | 데이터(SQLite), 세이브, 사용자, 인벤토리, 규칙 수치 제공, 값 검증 |
| 통신 | `fetch` + `VITE_API_BASE_URL` | REST(JSON) 우선, 실시간이 필요해지면 WebSocket 추가 |

- **1차는 REST(JSON)**: 설정 조회, 세이브·불러오기, 인벤토리는 요청-응답이면 충분하다. 구현·디버깅·CORS 가 단순하다.
- **WebSocket(`/ws`)은 필요해질 때 추가**: 멀티플레이, 서버 푸시 알림, 서버 권위 전투 중계(S4) 같은 실시간 요구가 생길 때. 같은 인증 토큰을 쓰고 메시지는 `{type, payload}` 로 버전을 둔다.
- 요청·응답 타입은 `backend/api/openapi.yaml` 을 단일 계약으로 두고 FE 타입(`frontend/src/lib/api/`)을 여기서 맞춘다(계약 우선 원칙).
- 계약을 바꾸는 PR 은 FE·BE 를 한 PR 에서 함께 고친다(모노레포 이점).
- 규칙 로직 위치: S1~S3 는 판정이 FE 순수 로직에 남고 BE 는 값 제공·저장만 한다. 판정의 서버 이전은 S4 에서 별도 설계한다.

## 10. 인증 (Google OAuth, 향후)
- 방식: 서버 측 OAuth 2.0 Authorization Code(+PKCE). 로그인 후 서버가 **HttpOnly·Secure 세션 쿠키**를 발급한다.
- `user` 테이블에 `google_sub TEXT UNIQUE`(구글의 고유 ID)를 둔다. 이메일은 식별자로 쓰지 않는다.
- 새 외부 연동이라 **도입 시 별도 HITL 승인**(클라이언트 ID·시크릿은 서버 환경변수, 저장소에 커밋 금지, `VITE_*` 에 넣지 않음).
- 인증 전(S1~S2)에는 로컬 개발 전용 임시 사용자(`POST /api/v1/dev/users`)를 쓰고, 인증 도입 시 제거한다. 외부 공개 전에는 반드시 인증을 붙인다.

## 11. 아이템 종류와 규칙 (확정안)
기존 규칙(무기 강화 최대 5단계, 도시 휴식 20G)과 충돌하지 않게 **소비 아이템** 위주로 시작한다.

| id | 종류 | 효과 | 가격 | 비고 |
|---|---|---|---|---|
| `potion_hp` | 소비 | HP 40 회복 | 30G | |
| `potion_mp` | 소비 | MP 20 회복 | 25G | |
| `elixir` | 소비 | HP·MP 전부 회복 | 80G | 도시 휴식(20G)보다 비싸게 해 휴식을 대체하지 못하게 한다 |
| `weapon_*` | 무기 | 기존 단계 시스템 유지 | 기존 `(단계+1)×100G` | 인벤토리에 넣지 않고 `save.weapon` 으로만 관리 |

- 구매: 도시 칸에서 골드로 구매. 인벤토리는 아이템별 최대 9개.
- 사용: 전투 중에는 쓰지 않고 이동 대기 중에만 사용(자동 전투 규칙을 건드리지 않음).
- 수치는 `item` 테이블 시드에서만 바꾸고, 규칙 변경은 마이그레이션 PR 로 처리한다.
