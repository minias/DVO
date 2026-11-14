# DVO 개발 이력과 설계 요약

> 마일스톤별 기능 추가, 구조 변경, 설계 결정을 시간순으로 정리한다. 세션 재개용 요약은 `docs/CONTEXT.md`(로컬 전용), 백엔드 상세 설계는 `docs/DESIGN_SQLITE.md` 를 본다. 갱신: 2026-11-14

## 1. 프로젝트 개요

- 주사위 턴제 보드 RPG 웹게임. 목표는 모든 OS 의 Chrome 에서 동작하는 웹게임을 빠르게 만드는 것이다.
- 스택: SvelteKit 2 + Svelte 5(Runes), TypeScript, Tailwind 4, Vite, Vitest, Paraglide(ko/en), Canvas2D.
- 백엔드: Go(`net/http`) + SQLite(`modernc.org/sqlite`, 순수 Go).
- 브랜치: `main` 은 릴리스 전용, `dev` 는 통합 브랜치. 모든 변경은 PR 로 `dev` 에 병합한다(필수 체크 `verify (ubuntu + chromium)`).

## 2. 마일스톤별 기능 (프론트엔드 게임 로직)

| 마일스톤       | 내용                                                   | 비고                         |
| -------------- | ------------------------------------------------------ | ---------------------------- |
| M1 주사위      | 주사위 서비스와 단위 테스트                            | 순수 로직                    |
| M2 턴·이동     | 턴·이동 상태(Runes), 캔버스 렌더 연동, 이동 애니메이션 | 렌더러와 상태 분리           |
| M3 상태창      | HP/MP/GOLD 상태창, 액션 바, Tailwind 반응형            | Chrome 보정 포함             |
| M4 다국어      | ko/en 전환(리로드 없음), 보드 타일 이름 번역           | #27                          |
| M5 이벤트·전투 | 타일 이벤트, 자동 전투, 보스, 출발 보상                | #29, 수치는 `tile.config.ts` |

### M4 설계 요약

- `BoardTile.name` 을 `nameKey` 로 바꾸고 번역 키(`board_tile_*`)로 참조한다.
- `TextResolver` 를 렌더러에 주입하고, `setLocale(l, { reload: false })` 와 반응형 locale 로 전환한다.
- `GameSession` 은 `{#key locale}` 밖에서 생성해 언어를 바꿔도 게임 상태가 유지된다.

### M5 이후 추가 기능

- #33 경험치·레벨 성장(`GROWTH_CONFIG`): 레벨당 최대 HP·MP·공격력 증가.
- #34 도시 휴식(20G, HP·MP 전체 회복)과 무기 강화, 감옥 벌금 30G 와 1턴 쉬기, MP 스킬 강타(10MP 로 공격 +10).
- #35 상태창에 무기 단계 표시.
- #37 도착 칸 효과 결과 강조 연출(렌더러).
- #38 보스 밸런스 상향(HP 200, 공격 15~35).
- 게임 수치는 `src/config/*.config.ts` 한 곳에서 조정하고, 순수 로직(`src/game/**`)은 설정 객체만 사용한다.

## 3. 저장소·운영 정비

- #22~#25 취약점 정리, 작업 규칙, SECURITY·CONTRIBUTING·LICENSE(GPL-3.0)·템플릿.
- #26 CI 권한 최소화, #28 README 개편, #30 README 의 M5 반영.
- #31 문서 전용 PR 은 CI 에서 브라우저·빌드 검증을 건너뛰고 서식만 검사(필수 체크는 항상 보고).
- #32 `.claude/` 를 gitignore 처리하고 추적 해제. 에이전트 정의는 로컬 전용.
- `dev` 룰셋: PR 필수, 필수 체크, force push·삭제 금지.

## 4. 저장소 분리: 프론트엔드·백엔드 (모노레포)

- 설계 결정(#39, #40): Go 백엔드 + SQLite, 모노레포 `frontend/` + `backend/`.
- FE/BE 역할은 네트워크(HTTP/JSON)로 분리한다. FE 는 화면·입력·연출, BE 는 데이터·저장·검증을 맡는다.
- #41(S0) 루트 앱 전체를 `git mv` 로 `frontend/` 에 이동(구조만 변경). Vercel Root Directory 는 `frontend` 로 지정한다.
- 향후 분리 재검토 시점: 다른 클라이언트 추가, 팀 분리, 공개 범위 차이가 생길 때(`git subtree split` 가능).

```
DVO/
├─ frontend/   SvelteKit 앱 (src, messages, package.json ...)
├─ backend/    Go 모듈 (cmd, internal, migrations, api, Makefile)
├─ docs/       공용 문서
└─ .github/    CI, Dependabot, 보안 워크플로
```

## 5. 로컬 DB(SQLite) 도입

### T2 백엔드 골격 (#47)

- `backend/` Go 모듈과 순수 Go SQLite 드라이버 도입. DB 경로는 `DVO_DB_PATH`, `*.db` 는 커밋하지 않는다.
- WAL, `busy_timeout`, `foreign_keys` 설정. 쓰기 커넥션은 1개.
- 마이그레이션은 `backend/migrations/NNN_*.sql` 을 내장(`go:embed`)하고 `PRAGMA user_version` 으로 순차 적용한다. 파일마다 하나의 트랜잭션.
- 001 스키마: 정적 데이터(`tile_def`, `foe`, `rule`, `item`)와 플레이어 데이터(`user`, `save`, `inventory`).
- 002 시드: 프론트 설정 값을 이식(타일 36칸, foe 2종, rule 25개). 값을 바꿀 때는 새 마이그레이션을 추가한다.
- 번역 문구는 DB 에 넣지 않고 `name_key` 로 프론트 messages 를 참조한다.

### T3 API 계약·CI (#50)

- `GET /api/v1/config`: 타일·foe·rule·item 일괄 조회. `GET /healthz`.
- CORS 허용 출처는 `DVO_CORS_ORIGINS`(쉼표 구분), 주소는 `DVO_ADDR`(기본 `127.0.0.1:8080`).
- `backend/api/openapi.yaml` 이 API 계약이다.
- CI `backend (go)` 잡은 `make check`(서식 → vet → 테스트)를 실행한다.

## 6. 의존성·보안 운영 규칙

- 의존성이나 생태계를 추가할 때는 같은 PR 에서 의존성 봇과 취약점 점검에 걸리지 않게 처리한다.
- `dependabot.yml`: npm(`/frontend`), gomod(`/backend`), github-actions. `vitest` 와 `@vitest/*` 는 한 그룹으로 묶고, `typescript` 메이저는 kit peer 범위 밖이라 제외한다(#49).
- 보안 워크플로: `npm audit`(운영 의존성 high 이상 차단), `govulncheck`, dependency review, CodeQL.
- 반복 명령: 백엔드는 `backend/Makefile`(`make check`, `make vuln`), 프론트는 `npm run verify` 와 `npm run verify:local`.

### 보안 갱신 이력

| 시점       | PR      | 내용                                                                                                                                                   |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1~M5      | #22~#25 | 취약점 정리, `overrides`(cookie, postcss-selector-parser, minimatch), SECURITY.md 추가                                                                 |
| 2026-11-14 | #49     | Dependabot gomod·vitest 그룹, `govulncheck` 게이트 추가                                                                                                |
| 2026-11-14 | #57     | 의존성 일괄 갱신(`@sveltejs/kit` 3, vitest 5, Go 1.26.11 — 표준 라이브러리 취약점 때문에 하한 상향), 역할별 보안 점검 분리, Dependabot PR #44~#54 정리 |
| 2026-11-14 | —       | 현재 전체 1건(low): `deepmerge` #46, 개발 의존성, 수정판 없음. 운영 의존성 0건                                                                         |

- `npm audit fix --force` 는 `@sveltejs/kit` 를 다운그레이드하므로 금지한다.
- 수정판이 나오기 전까지 #46 은 유지하고, 운영 의존성에 high 이상이 생기면 main 병합을 차단한다.

## 7. 로드맵

| 단계               | 내용                                                                                       | 상태            |
| ------------------ | ------------------------------------------------------------------------------------------ | --------------- |
| T4 프론트 연동     | `http.ts`(`VITE_API_BASE_URL`), `loadGameConfig()`(기본값 폴백)                            | 예정            |
| T5 사용자·세이브   | 개발용 임시 사용자, 세이브 조회·저장, 새로고침 복원                                        | 예정            |
| T6 아이템·인벤토리 | 소비 아이템 3종(HP 물약, MP 물약, 엘릭서), 도시 구매, 이동 대기 중 사용, 아이템별 최대 9개 | 예정            |
| T7 Google OAuth    | 서버 측 Authorization Code(+PKCE), HttpOnly 세션 쿠키, 임시 사용자 제거                    | 별도 승인 필요  |
| T8 서버 권위화     | 전투·보상 판정을 서버로 이전, WebSocket                                                    | 선택, 별도 설계 |
