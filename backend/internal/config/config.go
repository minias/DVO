// Package config 는 DB 의 정적 게임 데이터(타일·몬스터·수치·아이템)를 읽는다.
package config

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

// Tile 은 보드 한 칸의 정의다. 번역 문구는 DB 에 두지 않고 NameKey 로 프론트 messages 를 참조한다.
type Tile struct {
	ID      int    `json:"id"`
	Type    string `json:"type"`
	NameKey string `json:"nameKey"`
}

// Foe 는 일반 몬스터·보스 수치다.
type Foe struct {
	ID        string `json:"id"`
	HP        int    `json:"hp"`
	AttackMin int    `json:"attackMin"`
	AttackMax int    `json:"attackMax"`
	RewardMin int    `json:"rewardMin"`
	RewardMax int    `json:"rewardMax"`
	Exp       int    `json:"exp"`
}

// Item 은 아이템 정의다. 효과(EffectJSON)는 아이템 도메인(T6)에서 해석한다.
type Item struct {
	ID         string          `json:"id"`
	Kind       string          `json:"kind"`
	NameKey    string          `json:"nameKey"`
	Price      int             `json:"price"`
	EffectJSON json.RawMessage `json:"effect,omitempty"`
}

// GameConfig 는 GET /api/v1/config 응답 본문이다.
type GameConfig struct {
	Tiles []Tile             `json:"tiles"`
	Foes  []Foe              `json:"foes"`
	Rules map[string]float64 `json:"rules"`
	Items []Item             `json:"items"`
}

// Load 는 정적 데이터를 한 번에 읽는다. 목록은 항상 빈 배열 이상으로 반환한다.
func Load(conn *sql.DB) (*GameConfig, error) {
	cfg := &GameConfig{
		Tiles: []Tile{},
		Foes:  []Foe{},
		Rules: map[string]float64{},
		Items: []Item{},
	}

	rows, err := conn.Query("SELECT id, type, name_key FROM tile_def ORDER BY id")
	if err != nil {
		return nil, fmt.Errorf("tile_def 조회 실패: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var t Tile
		if err := rows.Scan(&t.ID, &t.Type, &t.NameKey); err != nil {
			return nil, err
		}
		cfg.Tiles = append(cfg.Tiles, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	foeRows, err := conn.Query("SELECT id, hp, attack_min, attack_max, reward_min, reward_max, exp FROM foe ORDER BY id")
	if err != nil {
		return nil, fmt.Errorf("foe 조회 실패: %w", err)
	}
	defer foeRows.Close()
	for foeRows.Next() {
		var f Foe
		if err := foeRows.Scan(&f.ID, &f.HP, &f.AttackMin, &f.AttackMax, &f.RewardMin, &f.RewardMax, &f.Exp); err != nil {
			return nil, err
		}
		cfg.Foes = append(cfg.Foes, f)
	}
	if err := foeRows.Err(); err != nil {
		return nil, err
	}

	ruleRows, err := conn.Query("SELECT key, value FROM rule")
	if err != nil {
		return nil, fmt.Errorf("rule 조회 실패: %w", err)
	}
	defer ruleRows.Close()
	for ruleRows.Next() {
		var k string
		var v float64
		if err := ruleRows.Scan(&k, &v); err != nil {
			return nil, err
		}
		cfg.Rules[k] = v
	}
	if err := ruleRows.Err(); err != nil {
		return nil, err
	}

	itemRows, err := conn.Query("SELECT id, kind, name_key, price, COALESCE(effect_json, '') FROM item ORDER BY id")
	if err != nil {
		return nil, fmt.Errorf("item 조회 실패: %w", err)
	}
	defer itemRows.Close()
	for itemRows.Next() {
		var it Item
		var effect string
		if err := itemRows.Scan(&it.ID, &it.Kind, &it.NameKey, &it.Price, &effect); err != nil {
			return nil, err
		}
		if effect != "" {
			it.EffectJSON = json.RawMessage(effect)
		}
		cfg.Items = append(cfg.Items, it)
	}
	return cfg, itemRows.Err()
}
