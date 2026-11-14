// Package db 는 SQLite 연결과 마이그레이션을 담당한다.
package db

import (
	"database/sql"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/minias/DVO/backend/migrations"

	_ "modernc.org/sqlite" // 순수 Go SQLite 드라이버 (CGO 없음)
)

var migrationFS = migrations.FS

// Open 은 SQLite 파일을 열고 WAL·busy_timeout 을 설정한다.
// 쓰기가 한 프로세스에 모이므로 커넥션은 1개로 제한한다.
func Open(path string) (*sql.DB, error) {
	dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)", path)
	conn, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("db 열기 실패: %w", err)
	}
	conn.SetMaxOpenConns(1)
	if err := conn.Ping(); err != nil {
		conn.Close()
		return nil, fmt.Errorf("db 연결 실패: %w", err)
	}
	return conn, nil
}

// Migrate 는 PRAGMA user_version 보다 번호가 큰 마이그레이션만 순서대로 적용한다.
// 파일명은 NNN_이름.sql 형식이며 각 파일은 하나의 트랜잭션으로 실행된다.
func Migrate(conn *sql.DB) error {
	var current int
	if err := conn.QueryRow("PRAGMA user_version").Scan(&current); err != nil {
		return fmt.Errorf("user_version 조회 실패: %w", err)
	}

	entries, err := migrationFS.ReadDir(".")
	if err != nil {
		return err
	}
	names := make([]string, 0, len(entries))
	for _, e := range entries {
		names = append(names, e.Name())
	}
	sort.Strings(names)

	for _, name := range names {
		num, err := strconv.Atoi(strings.SplitN(name, "_", 2)[0])
		if err != nil {
			return fmt.Errorf("마이그레이션 파일명 오류 %q: %w", name, err)
		}
		if num <= current {
			continue
		}
		body, err := migrationFS.ReadFile(name)
		if err != nil {
			return err
		}
		tx, err := conn.Begin()
		if err != nil {
			return err
		}
		if _, err := tx.Exec(string(body)); err != nil {
			tx.Rollback()
			return fmt.Errorf("마이그레이션 %s 실패: %w", name, err)
		}
		// PRAGMA 는 바인딩 파라미터를 쓸 수 없어 정수를 직접 넣는다.
		if _, err := tx.Exec(fmt.Sprintf("PRAGMA user_version = %d", num)); err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}
