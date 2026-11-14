package api

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/minias/DVO/backend/internal/config"
)

// 요청 본문 최대 크기. 세이브·사용자 JSON 은 매우 작다.
const maxBodyBytes = 4 << 10

// maxNameRunes 는 임시 사용자 이름의 최대 글자 수다.
const maxNameRunes = 32

// SaveData 는 플레이어 한 명의 진행 상태다. 필드 계약은 openapi.yaml 의 Save 와 같다.
type SaveData struct {
	HP        int    `json:"hp"`
	MaxHP     int    `json:"maxHp"`
	MP        int    `json:"mp"`
	MaxMP     int    `json:"maxMp"`
	Gold      int    `json:"gold"`
	Level     int    `json:"level"`
	Exp       int    `json:"exp"`
	Weapon    int    `json:"weapon"`
	Position  int    `json:"position"`
	UpdatedAt string `json:"updatedAt,omitempty"`
}

// validate 는 값 범위를 검사한다. 판정 로직은 프론트에 있으므로 서버는 명백한 오염만 막는다.
func (s SaveData) validate(tileCount int) bool {
	return s.MaxHP >= 1 && s.MaxMP >= 0 &&
		s.HP >= 0 && s.HP <= s.MaxHP &&
		s.MP >= 0 && s.MP <= s.MaxMP &&
		s.Gold >= 0 && s.Level >= 1 && s.Exp >= 0 && s.Weapon >= 0 &&
		s.Position >= 0 && s.Position < tileCount
}

// registerDevRoutes 는 인증 없는 개발용 사용자·세이브 경로를 등록한다.
// 인증(Google OAuth) 도입 시 제거하며, 외부 공개 환경에서는 켜지 않는다.
func registerDevRoutes(mux *http.ServeMux, conn *sql.DB) {
	mux.HandleFunc("POST /api/v1/dev/users", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name string `json:"name"`
		}
		if !decodeBody(w, r, &req) {
			return
		}
		name := strings.TrimSpace(req.Name)
		if name == "" || utf8.RuneCountInString(name) > maxNameRunes {
			writeError(w, http.StatusBadRequest, "invalid_name")
			return
		}
		res, err := conn.Exec(`INSERT INTO user (name, created_at) VALUES (?, ?)`, name, now())
		if err != nil {
			// UNIQUE 위반(이름 중복)은 충돌로 알린다.
			if strings.Contains(err.Error(), "UNIQUE") {
				writeError(w, http.StatusConflict, "name_taken")
				return
			}
			serverError(w, "사용자 생성 실패", err)
			return
		}
		id, _ := res.LastInsertId()
		writeJSON(w, http.StatusCreated, map[string]any{"id": id, "name": name})
	})

	mux.HandleFunc("GET /api/v1/users/{id}/save", func(w http.ResponseWriter, r *http.Request) {
		id, ok := pathID(w, r)
		if !ok {
			return
		}
		var s SaveData
		err := conn.QueryRow(`SELECT hp, max_hp, mp, max_mp, gold, level, exp, weapon, position, updated_at
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
		writeJSON(w, http.StatusOK, s)
	})

	mux.HandleFunc("PUT /api/v1/users/{id}/save", func(w http.ResponseWriter, r *http.Request) {
		id, ok := pathID(w, r)
		if !ok {
			return
		}
		var s SaveData
		if !decodeBody(w, r, &s) {
			return
		}
		// 칸 수는 DB 의 보드 정의를 기준으로 검사한다.
		cfg, err := config.Load(conn)
		if err != nil {
			serverError(w, "config 조회 실패", err)
			return
		}
		if !s.validate(len(cfg.Tiles)) {
			writeError(w, http.StatusBadRequest, "invalid_save")
			return
		}
		var exists int
		if err := conn.QueryRow(`SELECT 1 FROM user WHERE id = ?`, id).Scan(&exists); errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found")
			return
		} else if err != nil {
			serverError(w, "사용자 조회 실패", err)
			return
		}
		s.UpdatedAt = now()
		// 사용자당 세이브는 1건이므로 upsert 한다.
		_, err = conn.Exec(`INSERT INTO save (user_id, hp, max_hp, mp, max_mp, gold, level, exp, weapon, position, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(user_id) DO UPDATE SET
			  hp = excluded.hp, max_hp = excluded.max_hp, mp = excluded.mp, max_mp = excluded.max_mp,
			  gold = excluded.gold, level = excluded.level, exp = excluded.exp, weapon = excluded.weapon,
			  position = excluded.position, updated_at = excluded.updated_at`,
			id, s.HP, s.MaxHP, s.MP, s.MaxMP, s.Gold, s.Level, s.Exp, s.Weapon, s.Position, s.UpdatedAt)
		if err != nil {
			serverError(w, "세이브 저장 실패", err)
			return
		}
		writeJSON(w, http.StatusOK, s)
	})
}

func now() string { return time.Now().UTC().Format(time.RFC3339) }

func writeError(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]string{"error": code})
}

func serverError(w http.ResponseWriter, msg string, err error) {
	log.Printf("%s: %v", msg, err)
	writeError(w, http.StatusInternalServerError, "internal")
}

// pathID 는 경로의 {id} 를 양의 정수로 읽는다. 실패하면 400 을 쓰고 false 를 돌려준다.
func pathID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "invalid_id")
		return 0, false
	}
	return id, true
}

// decodeBody 는 크기를 제한하고 알 수 없는 필드를 거부하며 JSON 본문을 읽는다.
func decodeBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body")
		return false
	}
	return true
}
