# 백엔드 반복 작업 모음. 사용법: backend/ 에서 `make <대상>` (대상 목록은 `make help`)

# CI 와 같은 도구 버전을 쓴다 (.github/workflows/security.yml 의 govulncheck 와 맞출 것)
GOVULNCHECK_VERSION := v1.1.4

.DEFAULT_GOAL := help
.PHONY: help run build fmt fmt-check vet test vuln vuln-summary outdated update check clean

help: ## 대상 목록 보기
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-10s %s\n", $$1, $$2}'

run: ## 서버 실행 (DVO_DB_PATH, DVO_ADDR, DVO_CORS_ORIGINS 환경변수 사용)
	go run ./cmd/server

build: ## 서버 바이너리를 bin/server 로 빌드
	go build -o bin/server ./cmd/server

fmt: ## gofmt 로 서식 정리
	gofmt -w .

fmt-check: ## 서식 검사 (정리가 필요한 파일이 있으면 실패)
	@test -z "$$(gofmt -l .)" || (echo "gofmt 필요:"; gofmt -l .; exit 1)

vet: ## 정적 검사
	go vet ./...

test: ## 단위 테스트
	go test ./...

vuln: ## 취약점 점검 (govulncheck)
	go run golang.org/x/vuln/cmd/govulncheck@$(GOVULNCHECK_VERSION) ./...

vuln-summary: ## 취약점 이름과 수정 버전만 요약 (출력이 길 때)
	@go run golang.org/x/vuln/cmd/govulncheck@$(GOVULNCHECK_VERSION) ./... 2>&1 | grep -E "^Vulnerability|Found in|Fixed in|No vulnerabilities" | sort -u || true

outdated: ## 갱신 가능한 의존성 목록
	@go list -u -m -f '{{if .Update}}{{.Path}} {{.Version}} -> {{.Update.Version}}{{end}}' all

update: ## 의존성을 모두 최신으로 올리고 정리 (이후 make check 로 확인)
	go get -u ./...
	go mod tidy

check: fmt-check vet test ## 커밋 전 게이트 (서식 → vet → 테스트). CI 의 backend 잡과 같다

clean: ## 빌드 산출물 삭제
	rm -rf bin
