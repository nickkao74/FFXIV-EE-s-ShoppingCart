-- D1 結構定義。本機與正式環境共用。
-- 本機初始化：npm run db:init
-- 正式環境：   npm run db:init:remote

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  discord_user_id  TEXT NOT NULL,
  nickname         TEXT NOT NULL,
  lines_json       TEXT NOT NULL,
  self_supply_json TEXT NOT NULL,
  note             TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'pending',
  created_at       INTEGER NOT NULL,
  completed_at     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS stock (
  name TEXT PRIMARY KEY,
  qty  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id       TEXT PRIMARY KEY,
  type     TEXT NOT NULL,
  text     TEXT NOT NULL,
  at       INTEGER NOT NULL,
  order_id TEXT,
  nickname TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_at ON events (at DESC);
