// src/config/item.config.ts

// 소비 아이템 표시 정보. 가격·효과의 권위는 서버(backend/migrations/003)이며,
// 여기 값은 화면 표시용이다. 서버와 어긋나면 서버 응답이 우선한다.
export const ITEM_IDS = ['potion_hp', 'potion_mp', 'elixir'] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export const ITEM_PRICES: Record<ItemId, number> = {
	potion_hp: 30,
	potion_mp: 25,
	elixir: 80
};

// 아이템별 최대 보유 수 (서버 rule.max_item_qty 와 같은 값)
export const MAX_ITEM_QTY = 9;
