package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/minias/DVO/backend/internal/config"
	"github.com/minias/DVO/backend/internal/db"
)

func newTestHandler(t *testing.T, origins []string) http.Handler {
	t.Helper()
	conn, err := db.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	if err := db.Migrate(conn); err != nil {
		t.Fatal(err)
	}
	return NewHandler(conn, origins, true)
}

// /config 가 시드된 정적 데이터를 JSON 으로 돌려주는지 확인한다.
func TestConfigReturnsSeededData(t *testing.T) {
	h := newTestHandler(t, nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest("GET", "/api/v1/config", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("상태 코드 = %d, 기대값 200", rec.Code)
	}
	var cfg config.GameConfig
	if err := json.Unmarshal(rec.Body.Bytes(), &cfg); err != nil {
		t.Fatal(err)
	}
	if len(cfg.Tiles) != 36 || len(cfg.Foes) != 2 || len(cfg.Rules) != 25 {
		t.Errorf("타일 %d, foe %d, rule %d (기대값 36, 2, 25)", len(cfg.Tiles), len(cfg.Foes), len(cfg.Rules))
	}
	if cfg.Items == nil {
		t.Error("items 는 null 이 아니라 빈 배열이어야 한다")
	}
	if cfg.Rules["jail_fine"] != 30 {
		t.Errorf("jail_fine = %v, 기대값 30", cfg.Rules["jail_fine"])
	}
}

// 허용 목록의 출처에만 CORS 헤더가 붙는지 확인한다.
func TestCORSAllowlist(t *testing.T) {
	h := newTestHandler(t, []string{"http://localhost:5173"})

	allowed := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/healthz", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	h.ServeHTTP(allowed, req)
	if got := allowed.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Errorf("허용 출처 헤더 = %q", got)
	}

	denied := httptest.NewRecorder()
	req = httptest.NewRequest("GET", "/healthz", nil)
	req.Header.Set("Origin", "http://evil.example")
	h.ServeHTTP(denied, req)
	if got := denied.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("비허용 출처에 헤더가 붙음: %q", got)
	}

	pre := httptest.NewRecorder()
	req = httptest.NewRequest("OPTIONS", "/api/v1/config", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	h.ServeHTTP(pre, req)
	if pre.Code != http.StatusNoContent {
		t.Errorf("사전 요청 상태 = %d, 기대값 204", pre.Code)
	}
}
