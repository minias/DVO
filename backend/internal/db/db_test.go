package db

import (
	"path/filepath"
	"testing"
)

// 마이그레이션이 스키마와 시드를 만들고, 재실행해도 중복 적용되지 않는지 확인한다.
func TestMigrateSeedsStaticData(t *testing.T) {
	conn, err := Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()

	for i := range 2 { // 두 번째 호출은 아무 일도 하지 않아야 한다
		if err := Migrate(conn); err != nil {
			t.Fatalf("마이그레이션 %d회차 실패: %v", i+1, err)
		}
	}

	var version int
	conn.QueryRow("PRAGMA user_version").Scan(&version)
	if version != 2 {
		t.Errorf("user_version = %d, 기대값 2", version)
	}

	counts := map[string]int{"tile_def": 36, "foe": 2, "rule": 25}
	for table, want := range counts {
		var got int
		if err := conn.QueryRow("SELECT COUNT(*) FROM " + table).Scan(&got); err != nil {
			t.Fatal(err)
		}
		if got != want {
			t.Errorf("%s 행 수 = %d, 기대값 %d", table, got, want)
		}
	}

	var hp int
	conn.QueryRow("SELECT hp FROM foe WHERE id = 'boss'").Scan(&hp)
	if hp != 200 {
		t.Errorf("보스 HP = %d, 기대값 200", hp)
	}
}
