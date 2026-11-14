// 서버 진입점. 현재(T2)는 DB 를 열고 마이그레이션만 적용한다. API 는 T3 에서 추가한다.
package main

import (
	"log"
	"os"

	"github.com/minias/DVO/backend/internal/db"
)

func main() {
	// DB 경로는 서버 환경변수로 받는다. 기본값은 로컬 개발용 파일이다.
	path := os.Getenv("DVO_DB_PATH")
	if path == "" {
		path = "dvo.db"
	}

	conn, err := db.Open(path)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	if err := db.Migrate(conn); err != nil {
		log.Fatal(err)
	}
	log.Printf("DB 준비 완료: %s", path)
}
