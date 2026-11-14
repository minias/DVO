-- 소비 아이템 3종과 인벤토리 규칙(docs/DESIGN_SQLITE.md 11절).
-- effect_json: healHp·healMp 는 회복량, hpFull·mpFull 은 최대치까지 회복.
INSERT INTO item (id, kind, name_key, price, effect_json) VALUES
  ('potion_hp', 'POTION', 'item_potion_hp', 30, '{"healHp":40}'),
  ('potion_mp', 'POTION', 'item_potion_mp', 25, '{"healMp":20}'),
  ('elixir',    'POTION', 'item_elixir',    80, '{"hpFull":true,"mpFull":true}');

INSERT INTO rule (key, value) VALUES ('max_item_qty', 9);
