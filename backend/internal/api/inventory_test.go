package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"
)

// newUserWithSave 는 사용자와 세이브(gold, hp)를 만들고 경로 접두어를 돌려준다.
func newUserWithSave(t *testing.T, h http.Handler, name string, gold, hp int) string {
	t.Helper()
	rec := do(h, "POST", "/api/v1/dev/users", `{"name":"`+name+`"}`)
	var u struct {
		ID int64 `json:"id"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &u); err != nil || u.ID < 1 {
		t.Fatalf("사용자 생성 실패: %s", rec.Body.String())
	}
	base := "/api/v1/users/" + itoa(u.ID)
	save := strings.Replace(strings.Replace(validSave, `"gold":150`, `"gold":`+itoa(int64(gold)), 1),
		`"hp":80`, `"hp":`+itoa(int64(hp)), 1)
	if got := do(h, "PUT", base+"/save", save).Code; got != http.StatusOK {
		t.Fatalf("세이브 저장 = %d", got)
	}
	return base
}

func decodeResult(t *testing.T, body []byte) itemResult {
	t.Helper()
	var r itemResult
	if err := json.Unmarshal(body, &r); err != nil {
		t.Fatalf("응답 해석 실패: %s", body)
	}
	return r
}

// 구매하면 골드가 줄고 수량이 늘며, 사용하면 수량이 줄고 HP 가 최대치까지만 회복된다.
func TestBuyAndUseItem(t *testing.T) {
	h := newTestHandler(t, nil)
	base := newUserWithSave(t, h, "buyer", 100, 80)

	rec := do(h, "POST", base+"/inventory/buy", `{"itemId":"potion_hp"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("구매 = %d %s", rec.Code, rec.Body.String())
	}
	r := decodeResult(t, rec.Body.Bytes())
	if r.Save.Gold != 70 || len(r.Inventory) != 1 || r.Inventory[0].Qty != 1 {
		t.Errorf("구매 결과 불일치: %+v", r)
	}

	// HP 80 + 40 은 최대 100 을 넘지 않는다.
	rec = do(h, "POST", base+"/inventory/use", `{"itemId":"potion_hp"}`)
	r = decodeResult(t, rec.Body.Bytes())
	if rec.Code != http.StatusOK || r.Save.HP != 100 || len(r.Inventory) != 0 {
		t.Errorf("사용 결과 불일치: %d %+v", rec.Code, r)
	}

	// 서버에 저장된 값도 같아야 한다.
	var s SaveData
	_ = json.Unmarshal(do(h, "GET", base+"/save", "").Body.Bytes(), &s)
	if s.HP != 100 || s.Gold != 70 {
		t.Errorf("저장된 세이브 불일치: %+v", s)
	}
}

// 골드 부족·보유 한도·미보유 사용·잘못된 아이템은 거절하고 상태를 바꾸지 않는다.
func TestItemRejections(t *testing.T) {
	h := newTestHandler(t, nil)
	base := newUserWithSave(t, h, "poor", 10, 50)

	cases := []struct {
		name, path, body string
		want             int
	}{
		{"골드 부족", "/inventory/buy", `{"itemId":"elixir"}`, http.StatusConflict},
		{"미보유 사용", "/inventory/use", `{"itemId":"potion_hp"}`, http.StatusConflict},
		{"없는 아이템", "/inventory/buy", `{"itemId":"nope"}`, http.StatusBadRequest},
		{"빈 아이템", "/inventory/buy", `{"itemId":""}`, http.StatusBadRequest},
		{"알 수 없는 필드", "/inventory/buy", `{"itemId":"elixir","x":1}`, http.StatusBadRequest},
	}
	for _, c := range cases {
		if got := do(h, "POST", base+c.path, c.body).Code; got != c.want {
			t.Errorf("%s = %d, 기대값 %d", c.name, got, c.want)
		}
	}
	var s SaveData
	_ = json.Unmarshal(do(h, "GET", base+"/save", "").Body.Bytes(), &s)
	if s.Gold != 10 || s.HP != 50 {
		t.Errorf("거절 후 세이브가 바뀜: %+v", s)
	}

	// 세이브가 없는 사용자는 404.
	if got := do(h, "POST", "/api/v1/users/9999/inventory/buy", `{"itemId":"potion_hp"}`).Code; got != http.StatusNotFound {
		t.Errorf("없는 사용자 = %d, 기대값 404", got)
	}
}

// 아이템별 최대 9개까지만 보유할 수 있다.
func TestInventoryLimit(t *testing.T) {
	h := newTestHandler(t, nil)
	base := newUserWithSave(t, h, "rich", 1000, 50)

	for i := range 9 {
		if got := do(h, "POST", base+"/inventory/buy", `{"itemId":"potion_mp"}`).Code; got != http.StatusOK {
			t.Fatalf("%d번째 구매 = %d", i+1, got)
		}
	}
	if got := do(h, "POST", base+"/inventory/buy", `{"itemId":"potion_mp"}`).Code; got != http.StatusConflict {
		t.Errorf("10번째 구매 = %d, 기대값 409", got)
	}

	rec := do(h, "GET", base+"/inventory", "")
	var inv []InventoryEntry
	_ = json.Unmarshal(rec.Body.Bytes(), &inv)
	if len(inv) != 1 || inv[0].Qty != 9 {
		t.Errorf("인벤토리 = %s", rec.Body.String())
	}
}

// 엘릭서는 HP·MP 를 모두 최대치로 채운다.
func TestElixirRestoresAll(t *testing.T) {
	h := newTestHandler(t, nil)
	base := newUserWithSave(t, h, "elix", 100, 10)
	do(h, "POST", base+"/inventory/buy", `{"itemId":"elixir"}`)
	r := decodeResult(t, do(h, "POST", base+"/inventory/use", `{"itemId":"elixir"}`).Body.Bytes())
	if r.Save.HP != 100 || r.Save.MP != 30 {
		t.Errorf("엘릭서 효과 불일치: %+v", r.Save)
	}
}
