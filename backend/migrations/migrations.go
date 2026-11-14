// Package migrations 는 SQL 마이그레이션 파일을 바이너리에 내장한다.
package migrations

import "embed"

// FS 는 NNN_이름.sql 파일 모음이다.
//
//go:embed *.sql
var FS embed.FS
