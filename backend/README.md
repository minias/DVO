# DVO 백엔드

게임의 정적 데이터(타일, 몬스터, 수치, 아이템)와 플레이어 데이터(사용자, 세이브, 인벤토리)를 관리하는 HTTP API 서버. Go 표준 `net/http` 와 SQLite 를 쓴다. 프론트엔드(`../frontend`)와는 HTTP/JSON 으로만 통신한다.

## 기술 스택

- Go 1.26.11 이상(`go.mod` 기준, 표준 라이브러리 보안 패치 버전)
- SQLite 드라이버: `modernc.org/sqlite` (순수 Go, CGO 불필요)
- 외부 웹 프레임워크 없음(`net/http`)

## 실행 방법

```bash
cd backend
make run                 # 서버 실행 (기본 127.0.0.1:8080, DB 파일 dvo.db)
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/api/v1/config
```

서버는 시작할 때 DB 파일이 없으면 만들고 마이그레이션을 적용한다.

## 환경변수

| 이름                | 기본값           | 설명                                                                                                             |
| ------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DVO_DB_PATH`       | `dvo.db`         | SQLite 파일 경로 (`*.db` 는 커밋하지 않는다)                                                                     |
| `DVO_ADDR`          | `127.0.0.1:8080` | 서버 주소                                                                                                        |
| `DVO_CORS_ORIGINS`  | 빈 값            | CORS 를 허용할 출처(쉼표 구분). 비우면 교차 출처 요청을 허용하지 않는다. 로컬 프론트 예: `http://localhost:5173` |
| `DVO_DEV_ENDPOINTS` | 꺼짐             | `1` 이면 인증 없는 개발용 사용자·세이브 API 를 연다. 로컬 개발 전용이며 외부 공개 환경에서는 켜지 않는다.        |

## 자주 쓰는 명령 (Makefile)

`make help` 로 전체 목록을 볼 수 있다.

| 명령                          | 설명                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `make run`                    | 서버 실행                                            |
| `make build`                  | `bin/server` 바이너리 빌드                           |
| `make check`                  | 서식 → vet → 테스트 (커밋 전 게이트, CI 와 동일)     |
| `make test` / `make vet`      | 단위 테스트 / 정적 검사                              |
| `make fmt` / `make fmt-check` | 서식 정리 / 서식 검사                                |
| `make vuln`                   | 취약점 점검(govulncheck, 상세)                       |
| `make vuln-summary`           | 취약점 이름과 수정 버전만 요약                       |
| `make outdated`               | 갱신 가능한 의존성 목록                              |
| `make update`                 | 의존성 일괄 갱신 후 정리 (이후 `make check` 로 확인) |

## API

계약은 [`api/openapi.yaml`](api/openapi.yaml) 이다.

| 메서드·경로          | 설명                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| `GET /healthz`       | 생존 확인                                                                   |
| `GET /api/v1/config` | 정적 게임 데이터(타일 정의, foe, rule, item) 일괄 조회. 앱 시작 시 1회 호출 |

사용자·세이브·인벤토리 API 는 단계적으로 추가한다. 현재는 인증이 없는 로컬 개발용이다.

## 폴더 구조

```
backend/
├─ cmd/server/        서버 진입점 (환경변수 읽기, DB 열기, 서버 시작)
├─ internal/
│  ├─ api/            HTTP 핸들러, CORS 미들웨어
│  ├─ config/         DB 의 정적 데이터를 읽어 응답 구조로 변환
│  └─ db/             연결(WAL, busy_timeout, foreign_keys)과 마이그레이션
├─ migrations/        NNN_이름.sql (바이너리에 내장)
├─ api/openapi.yaml   API 계약
└─ Makefile
```

## 데이터베이스와 마이그레이션

- 스키마 버전은 `PRAGMA user_version` 으로 관리하고, `migrations/NNN_*.sql` 을 번호 순서로 한 번씩 적용한다(파일마다 하나의 트랜잭션).
- `001_schema.sql` 은 테이블 정의, `002_seed_static.sql` 은 프론트의 게임 수치를 옮긴 시드(타일 36칸, 몬스터 2종, 수치 25개)다.
- 데이터나 스키마를 바꿀 때는 기존 파일을 고치지 말고 새 번호의 마이그레이션 파일을 추가한다.
- 번역 문구는 DB 에 넣지 않고 `name_key` 로 프론트의 `messages/*.json` 을 참조한다.
- 쓰기 커넥션은 1개로 제한하고 WAL 모드로 동작한다.

## 규칙

- 의존성을 추가하거나 올릴 때는 `make check` 와 `make vuln` 을 통과시킨다. 의존성 봇(Dependabot)은 `backend/` 변경 PR 에 `backend` 라벨을 붙인다.
- 사람이 읽는 주석은 한국어로 쓴다.
- 새 외부 의존성, 인증이 없는 엔드포인트 추가, 외부 클라우드 연동은 사용자 확인 후 진행한다.
