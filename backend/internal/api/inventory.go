package api

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
)

// 인벤토리 규칙 기본값. DB 의 rule.max_item_qty 가 있으면 그 값을 쓴다.
const defaultMaxItemQty = 9

// itemEffect 는 item.effect_json 의 해석 결과다.
type itemEffect struct {
	HealHP int  `json:"healHp"`
	HealMP int  `json:"healMp"`
	HPFull bool `json:"hpFull"`
	MPFull bool `json:"mpFull"`
}

// InventoryEntry 는 보유 아이템 한 종류와 수량이다.
type InventoryEntry struct {
	ItemID string `json:"itemId"`
	Qty    int    `json:"qty"`
}

// itemRequest 는 구매·사용 요청 본문이다.
type itemRequest struct {
	ItemID string `json:"itemId"`
}

// registerInventoryRoutes 는 인벤토리 조회와 구매·사용 경로를 등록한다.
// 골드·HP·MP 는 세이브 행에 있으므로 구매·사용은 한 트랜잭션에서 세이브와 인벤토리를 함께 바꾼다.
func registerInventoryRoutes(mux *http.ServeMux, conn *sql.DB) {
	mux.HandleFunc("GET /api/v1/users/{id}/inventory", func(w http.ResponseWriter, r *http.Request) {
		id, ok := pathID(w, r)
		if !ok {
			return
		}
		inv, err := loadInventory(conn, id)
		if err != nil {
			serverError(w, "인벤토리 조회 실패", err)
			return
		}
		writeJSON(w, http.StatusOK, inv)
	})

	mux.HandleFunc("POST /api/v1/users/{id}/inventory/buy", func(w http.ResponseWriter, r *http.Request) {
		handleItemAction(w, r, conn, buyItem)
	})
	mux.HandleFunc("POST /api/v1/users/{id}/inventory/use", func(w http.ResponseWriter, r *http.Request) {
		handleItemAction(w, r, conn, useItem)
	})
}

// itemResult 는 구매·사용 후의 세이브와 인벤토리다. 프론트는 이 값으로 로컬 상태를 맞춘다.
type itemResult struct {
	Save      SaveData         `json:"save"`
	Inventory []InventoryEntry `json:"inventory"`
}

// itemError 는 HTTP 상태와 오류 코드를 가진 도메인 오류다.
type itemError struct {
	status int
	code   string
}

func (e *itemError) Error() string { return e.code }

type itemAction func(tx *sql.Tx, userID int64, itemID string, save *SaveData) error

// handleItemAction 은 요청 검증, 트랜잭션, 응답 작성을 공통 처리한다.
func handleItemAction(w http.ResponseWriter, r *http.Request, conn *sql.DB, act itemAction) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var req itemRequest
	if !decodeBody(w, r, &req) {
		return
	}
	if req.ItemID == "" {
		writeError(w, http.StatusBadRequest, "invalid_item")
		return
	}

	tx, err := conn.Begin()
	if err != nil {
		serverError(w, "트랜잭션 시작 실패", err)
		return
	}
	defer tx.Rollback()

	var s SaveData
	err = tx.QueryRow(`SELECT hp, max_hp, mp, max_mp, gold, level, exp, weapon, position, updated_at
		FROM save WHERE user_id = ?`, id).
		Scan(&s.HP, &s.MaxHP, &s.MP, &s.MaxMP, &s.Gold, &s.Level, &s.Exp, &s.Weapon, &s.Position, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "not_found")
		return
	}
	if err != nil {
		serverError(w, "세이브 조회 실패", err)
		return
	}

	if err := act(tx, id, req.ItemID, &s); err != nil {
		if ie, ok := errors.AsType[*itemError](err); ok {
			writeError(w, ie.status, ie.code)
			return
		}
		serverError(w, "아이템 처리 실패", err)
		return
	}

	s.UpdatedAt = now()
	if _, err := tx.Exec(`UPDATE save SET hp = ?, mp = ?, gold = ?, updated_at = ? WHERE user_id = ?`,
		s.HP, s.MP, s.Gold, s.UpdatedAt, id); err != nil {
		serverError(w, "세이브 갱신 실패", err)
		return
	}
	inv, err := loadInventory(tx, id)
	if err != nil {
		serverError(w, "인벤토리 조회 실패", err)
		return
	}
	if err := tx.Commit(); err != nil {
		serverError(w, "커밋 실패", err)
		return
	}
	writeJSON(w, http.StatusOK, itemResult{Save: s, Inventory: inv})
}

// querier 는 *sql.DB 와 *sql.Tx 가 공통으로 가진 조회 메서드다.
type querier interface {
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
}

func loadInventory(q querier, userID int64) ([]InventoryEntry, error) {
	rows, err := q.Query(`SELECT item_id, qty FROM inventory WHERE user_id = ? AND qty > 0 ORDER BY item_id`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	inv := []InventoryEntry{}
	for rows.Next() {
		var e InventoryEntry
		if err := rows.Scan(&e.ItemID, &e.Qty); err != nil {
			return nil, err
		}
		inv = append(inv, e)
	}
	return inv, rows.Err()
}

func maxItemQty(q querier) int {
	var v float64
	if err := q.QueryRow(`SELECT value FROM rule WHERE key = 'max_item_qty'`).Scan(&v); err != nil || v < 1 {
		return defaultMaxItemQty
	}
	return int(v)
}

// lookupItem 은 소비 아이템 정의를 읽는다. 없거나 소비 아이템이 아니면 400 오류를 돌려준다.
func lookupItem(tx *sql.Tx, itemID string) (price int, eff itemEffect, err error) {
	var kind, effectJSON string
	err = tx.QueryRow(`SELECT kind, price, COALESCE(effect_json, '') FROM item WHERE id = ?`, itemID).
		Scan(&kind, &price, &effectJSON)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && kind != "POTION") {
		return 0, eff, &itemError{http.StatusBadRequest, "invalid_item"}
	}
	if err != nil {
		return 0, eff, err
	}
	if effectJSON != "" {
		if err := json.Unmarshal([]byte(effectJSON), &eff); err != nil {
			return 0, eff, err
		}
	}
	return price, eff, nil
}

// buyItem 은 골드를 차감하고 수량을 1 늘린다. 골드 부족·최대 보유량 초과는 409 로 거절한다.
func buyItem(tx *sql.Tx, userID int64, itemID string, s *SaveData) error {
	price, _, err := lookupItem(tx, itemID)
	if err != nil {
		return err
	}
	if s.Gold < price {
		return &itemError{http.StatusConflict, "not_enough_gold"}
	}
	var qty int
	if err := tx.QueryRow(`SELECT qty FROM inventory WHERE user_id = ? AND item_id = ?`, userID, itemID).
		Scan(&qty); err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	if qty >= maxItemQty(tx) {
		return &itemError{http.StatusConflict, "inventory_full"}
	}
	s.Gold -= price
	_, err = tx.Exec(`INSERT INTO inventory (user_id, item_id, qty) VALUES (?, ?, 1)
		ON CONFLICT(user_id, item_id) DO UPDATE SET qty = qty + 1`, userID, itemID)
	return err
}

// useItem 은 수량을 1 줄이고 효과를 적용한다. 없는 아이템은 409 로 거절한다.
func useItem(tx *sql.Tx, userID int64, itemID string, s *SaveData) error {
	_, eff, err := lookupItem(tx, itemID)
	if err != nil {
		return err
	}
	res, err := tx.Exec(`UPDATE inventory SET qty = qty - 1 WHERE user_id = ? AND item_id = ? AND qty > 0`, userID, itemID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return &itemError{http.StatusConflict, "no_item"}
	}
	if eff.HPFull {
		s.HP = s.MaxHP
	} else {
		s.HP = min(s.MaxHP, s.HP+eff.HealHP)
	}
	if eff.MPFull {
		s.MP = s.MaxMP
	} else {
		s.MP = min(s.MaxMP, s.MP+eff.HealMP)
	}
	return nil
}
