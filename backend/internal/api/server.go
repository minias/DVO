// Package api 는 HTTP 핸들러와 미들웨어를 제공한다. 표준 net/http 만 사용한다.
package api

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/minias/DVO/backend/internal/config"
)

// NewHandler 는 라우터를 만든다. allowedOrigins 는 CORS 를 허용할 출처 목록이다(비어 있으면 CORS 헤더 없음).
func NewHandler(conn *sql.DB, allowedOrigins []string) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// 정적 게임 데이터를 일괄 제공한다. 앱 시작 시 1회 호출한다.
	mux.HandleFunc("GET /api/v1/config", func(w http.ResponseWriter, r *http.Request) {
		cfg, err := config.Load(conn)
		if err != nil {
			log.Printf("config 조회 실패: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
			return
		}
		writeJSON(w, http.StatusOK, cfg)
	})

	return cors(allowedOrigins, mux)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		log.Printf("응답 쓰기 실패: %v", err)
	}
}

// cors 는 허용 목록에 있는 출처에만 CORS 헤더를 붙이고, 사전 요청(OPTIONS)에 응답한다.
func cors(allowed []string, next http.Handler) http.Handler {
	set := make(map[string]struct{}, len(allowed))
	for _, o := range allowed {
		set[o] = struct{}{}
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if _, ok := set[origin]; ok && origin != "" {
			h := w.Header()
			h.Set("Access-Control-Allow-Origin", origin)
			h.Set("Vary", "Origin")
			h.Set("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS")
			h.Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
