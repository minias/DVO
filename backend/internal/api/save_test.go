package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/minias/DVO/backend/internal/db"
)

// do 는 핸들러에 요청을 보내고 응답 기록기를 돌려준다.
func do(h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(method, path, strings.NewReader(body)))
	return rec
}

const validSave = `{"hp":80,"maxHp":100,"mp":20,"maxMp":30,"gold":150,"level":2,"exp":10,"weapon":1,"position":5}`

// 사용자 생성 → 세이브 없음(404) → 저장 → 조회 → 덮어쓰기 흐름을 확인한다.
func TestUserAndSaveFlow(t *testing.T) {
	h := newTestHandler(t, nil)

	rec := do(h, "POST", "/api/v1/dev/users", `{"name":"  tester  "}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("사용자 생성 = %d, 기대값 201", rec.Code)
	}
	var u struct {
		ID   int64  `json:"id"`
		Name string `json:"name"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &u); err != nil || u.ID < 1 || u.Name != "tester" {
		t.Fatalf("응답 = %s", rec.Body.String())
	}
	savePath := "/api/v1/users/" + itoa(u.ID) + "/save"

	if got := do(h, "GET", savePath, "").Code; got != http.StatusNotFound {
		t.Errorf("저장 전 조회 = %d, 기대값 404", got)
	}
	if got := do(h, "PUT", savePath, validSave).Code; got != http.StatusOK {
		t.Fatalf("저장 = %d, 기대값 200", got)
	}

	rec = do(h, "GET", savePath, "")
	var s SaveData
	if err := json.Unmarshal(rec.Body.Bytes(), &s); err != nil || rec.Code != http.StatusOK {
		t.Fatalf("조회 = %d %s", rec.Code, rec.Body.String())
	}
	if s.HP != 80 || s.Gold != 150 || s.Position != 5 || s.UpdatedAt == "" {
		t.Errorf("조회 값 불일치: %+v", s)
	}

	// 같은 사용자에게 다시 저장하면 1건을 덮어쓴다.
	do(h, "PUT", savePath, strings.Replace(validSave, `"gold":150`, `"gold":999`, 1))
	_ = json.Unmarshal(do(h, "GET", savePath, "").Body.Bytes(), &s)
	if s.Gold != 999 {
		t.Errorf("덮어쓰기 후 gold = %d, 기대값 999", s.Gold)
	}
}

// 잘못된 입력은 400, 중복 이름은 409, 없는 사용자는 404 로 거부한다.
func TestRejectInvalidRequests(t *testing.T) {
	h := newTestHandler(t, nil)
	do(h, "POST", "/api/v1/dev/users", `{"name":"dup"}`)

	cases := []struct {
		name, method, path, body string
		want                     int
	}{
		{"이름 중복", "POST", "/api/v1/dev/users", `{"name":"dup"}`, http.StatusConflict},
		{"빈 이름", "POST", "/api/v1/dev/users", `{"name":"  "}`, http.StatusBadRequest},
		{"긴 이름", "POST", "/api/v1/dev/users", `{"name":"` + strings.Repeat("가", 33) + `"}`, http.StatusBadRequest},
		{"알 수 없는 필드", "POST", "/api/v1/dev/users", `{"name":"x","admin":true}`, http.StatusBadRequest},
		{"잘못된 id", "GET", "/api/v1/users/abc/save", "", http.StatusBadRequest},
		{"HP 가 최대 초과", "PUT", "/api/v1/users/1/save", strings.Replace(validSave, `"hp":80`, `"hp":101`, 1), http.StatusBadRequest},
		{"칸 번호 범위 밖", "PUT", "/api/v1/users/1/save", strings.Replace(validSave, `"position":5`, `"position":36`, 1), http.StatusBadRequest},
		{"음수 골드", "PUT", "/api/v1/users/1/save", strings.Replace(validSave, `"gold":150`, `"gold":-1`, 1), http.StatusBadRequest},
		{"없는 사용자 저장", "PUT", "/api/v1/users/999/save", validSave, http.StatusNotFound},
	}
	for _, c := range cases {
		if got := do(h, c.method, c.path, c.body).Code; got != c.want {
			t.Errorf("%s: 상태 = %d, 기대값 %d", c.name, got, c.want)
		}
	}
}

// 개발용 경로는 플래그가 꺼져 있으면 등록되지 않아야 한다.
func TestDevRoutesDisabledByDefault(t *testing.T) {
	conn, err := db.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	if err := db.Migrate(conn); err != nil {
		t.Fatal(err)
	}
	h := NewHandler(conn, nil, false)
	if got := do(h, "POST", "/api/v1/dev/users", `{"name":"x"}`).Code; got != http.StatusNotFound {
		t.Errorf("비활성 상태에서 상태 = %d, 기대값 404", got)
	}
}

func itoa(n int64) string {
	b, _ := json.Marshal(n)
	return string(b)
}
