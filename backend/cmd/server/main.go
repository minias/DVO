// 서버 진입점. DB 를 열어 마이그레이션을 적용하고 HTTP API 를 제공한다.
package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/minias/DVO/backend/internal/api"
	"github.com/minias/DVO/backend/internal/db"
)

// getenv 는 환경변수가 비어 있으면 기본값을 돌려준다.
func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	// 설정은 모두 서버 환경변수로 받는다. 기본값은 로컬 개발용이다.
	dbPath := getenv("DVO_DB_PATH", "dvo.db")
	addr := getenv("DVO_ADDR", "127.0.0.1:8080")
	// CORS 허용 출처(쉼표 구분). 비우면 교차 출처 요청을 허용하지 않는다.
	var origins []string
	for o := range strings.SplitSeq(os.Getenv("DVO_CORS_ORIGINS"), ",") {
		if o = strings.TrimSpace(o); o != "" {
			origins = append(origins, o)
		}
	}

	// 인증 없는 개발용 사용자·세이브 경로. 로컬 개발에서만 "1" 로 켠다(외부 공개 금지).
	enableDev := os.Getenv("DVO_DEV_ENDPOINTS") == "1"

	conn, err := db.Open(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	if err := db.Migrate(conn); err != nil {
		log.Fatal(err)
	}

	srv := &http.Server{
		Addr:              addr,
		Handler:           api.NewHandler(conn, origins, enableDev),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("서버 시작: %s (DB %s)", addr, dbPath)
	log.Fatal(srv.ListenAndServe())
}
