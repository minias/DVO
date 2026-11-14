# 기여 가이드 (Contributing)

DiceVerse Online(DVO)에 관심 가져 주셔서 감사합니다. 이 문서는 변경을 제안하는 방법을 설명합니다.
참여하는 모든 분은 [행동 강령](CODE_OF_CONDUCT.md)을 따라야 합니다. 취약점은 공개 이슈가 아니라 [보안 정책](SECURITY.md)의 방법으로 제보해 주세요.

## 개발 환경

- Node.js `^20.19` / `^22.13` / `>=24` (권장 22, `.nvmrc`)
- 목표 실행 환경은 **Windows / macOS / Linux 의 최신 Chrome** 입니다.

```bash
cd frontend      # 앱은 frontend/ 에 있습니다
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run verify   # check → lint → test → build (PR 전에 통과해야 합니다)
npx playwright install chromium   # 브라우저 테스트를 로컬에서 돌릴 때 최초 1회
```

## 작업 흐름

1. 이슈를 먼저 열어 변경 내용을 논의합니다 (작은 수정은 생략 가능).
2. 저장소를 포크하거나 브랜치를 만들 때는 **`dev` 에서 분기**합니다. `main` 은 릴리스 전용입니다.
   - 브랜치 이름: `feat/*`, `fix/*`, `chore/*`, `docs/*`
3. 변경 후 `npm run verify` 가 통과하는지 확인합니다.
4. `dev` 를 대상으로 PR 을 만듭니다. PR 본문에는 요약·검증 결과를 적어 주세요.
5. CI(`verify`, `npm audit`, dependency review, CodeQL)가 모두 통과해야 병합됩니다.

작업 전에 `git fetch` 로 `dev` 의 최신 상태를 확인해 주세요. 봇(Dependabot)과 다른 기여자가 수시로 병합합니다.

## 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/ko/) 형식을 사용하고 설명은 한국어로 씁니다.

```text
feat(game): 주사위 서비스 추가
fix(renderer): 고해상도 화면에서 캔버스가 흐릿한 문제 수정
docs: README 구현 상태 갱신
```

## 코드 규칙

- **Svelte 5 Runes** 만 사용합니다 (`$state`, `$derived`, `$effect`). Svelte 4 스토어와 `export let` 은 쓰지 않습니다.
- **Config First**: 게임 수치(HP, 주사위 개수, 보드 크기 등)는 `frontend/src/config` 에서 관리하고 코드에 하드코딩하지 않습니다.
- **번역 키만 사용**: 화면 문자열은 직접 쓰지 않고 `frontend/messages/ko.json`, `frontend/messages/en.json` 에 키를 추가합니다. 키는 `ui_*`, `action_*`, `board_*` 처럼 snake_case 입니다.
- 게임 로직(`frontend/src/game`)은 프레임워크에 의존하지 않는 순수 함수로 만들고 단위 테스트를 함께 작성합니다.
- 코드 주석은 한국어로 작성합니다.
- API 주소는 `import.meta.env.VITE_API_BASE_URL` 로만 읽고 `localhost` 를 하드코딩하지 않습니다.

## 의존성

- 의존성 업데이트는 Dependabot 이 PR 로 제안합니다. 직접 올릴 때는 `npm audit` 결과가 나빠지지 않아야 합니다.
- 새 패키지를 추가하거나 메이저 버전을 올릴 때는 이유를 PR 에 설명해 주세요.
- 비밀 값(`.env`, 토큰)은 커밋하지 않습니다.

## 질문과 제안

사용법 질문이나 아이디어는 이슈로 남겨 주세요. 템플릿(버그 제보, 기능 제안)을 제공합니다.

## 라이선스

이 프로젝트는 [GPL-3.0](LICENSE) 라이선스입니다. PR 로 기여한 코드는 같은 라이선스로 제공되는 것에 동의한 것으로 봅니다.
