-- 001: 초기 스키마 (정적 데이터 + 플레이어 데이터)

-- 정적 데이터 (운영자가 갱신, 게임은 읽기만)
CREATE TABLE tile_def (
  id       INTEGER PRIMARY KEY,
  type     TEXT NOT NULL,
  name_key TEXT NOT NULL
);

-- 일반 몬스터·보스
CREATE TABLE foe (
  id         TEXT PRIMARY KEY,
  hp         INTEGER NOT NULL,
  attack_min INTEGER NOT NULL,
  attack_max INTEGER NOT NULL,
  reward_min INTEGER NOT NULL,
  reward_max INTEGER NOT NULL,
  exp        INTEGER NOT NULL
);

-- 이벤트·도시·감옥·스킬·성장 수치
CREATE TABLE rule (
  key   TEXT PRIMARY KEY,
  value REAL NOT NULL
);

CREATE TABLE item (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,
  name_key    TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  effect_json TEXT
);

-- 동적 데이터 (플레이어)
CREATE TABLE user (
  id         INTEGER PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE save (
  user_id    INTEGER PRIMARY KEY REFERENCES user(id),
  hp         INTEGER NOT NULL,
  max_hp     INTEGER NOT NULL,
  mp         INTEGER NOT NULL,
  max_mp     INTEGER NOT NULL,
  gold       INTEGER NOT NULL,
  level      INTEGER NOT NULL,
  exp        INTEGER NOT NULL,
  weapon     INTEGER NOT NULL,
  position   INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE inventory (
  user_id INTEGER NOT NULL REFERENCES user(id),
  item_id TEXT NOT NULL REFERENCES item(id),
  qty     INTEGER NOT NULL,
  PRIMARY KEY (user_id, item_id)
);
