// src/game/board/board.data.ts

import type { TileType } from './board.model';

export interface TileDefinition {
	type: TileType;
	nameKey: string; // 번역 키(messages/*.json 의 board_tile_*)
}
export const BOARD_TILE_DEFINITIONS: TileDefinition[] = [
	// =========================
	// [0~9] TOP (10)
	// =========================
	{ type: 'START', nameKey: 'board_tile_start' },
	{ type: 'CITY', nameKey: 'board_tile_ulsan' },
	{ type: 'EVENT', nameKey: 'board_tile_event' },
	{ type: 'CITY', nameKey: 'board_tile_busan' },
	{ type: 'BATTLE', nameKey: 'board_tile_battle' },
	{ type: 'CITY', nameKey: 'board_tile_daegu' },
	{ type: 'EVENT', nameKey: 'board_tile_reward' },
	{ type: 'CITY', nameKey: 'board_tile_pohang' },
	{ type: 'BATTLE', nameKey: 'board_tile_monster' },
	{ type: 'EVENT', nameKey: 'board_tile_blessing' },

	// =========================
	// [10~17] RIGHT (8)
	// =========================
	{ type: 'CITY', nameKey: 'board_tile_daejeon' },
	{ type: 'EVENT', nameKey: 'board_tile_trap' },
	{ type: 'CITY', nameKey: 'board_tile_suwon' },
	{ type: 'BATTLE', nameKey: 'board_tile_battle' },
	{ type: 'CITY', nameKey: 'board_tile_incheon' },
	{ type: 'BOSS', nameKey: 'board_tile_boss' },
	{ type: 'EVENT', nameKey: 'board_tile_chest' },
	{ type: 'CITY', nameKey: 'board_tile_seoul' },

	// =========================
	// [18~25] BOTTOM (8)
	// =========================
	{ type: 'CITY', nameKey: 'board_tile_chuncheon' },
	{ type: 'BATTLE', nameKey: 'board_tile_battle' },
	{ type: 'CITY', nameKey: 'board_tile_gangneung' },
	{ type: 'EVENT', nameKey: 'board_tile_bonus' },
	{ type: 'CITY', nameKey: 'board_tile_gyeongju' },
	{ type: 'CITY', nameKey: 'board_tile_changwon' },
	{ type: 'EVENT', nameKey: 'board_tile_luck' },
	{ type: 'BATTLE', nameKey: 'board_tile_boss_battle' },

	// =========================
	// [26~35] LEFT (10)
	// =========================
	{ type: 'CITY', nameKey: 'board_tile_jeju' },
	{ type: 'EVENT', nameKey: 'board_tile_golden_chest' },
	{ type: 'CITY', nameKey: 'board_tile_ulleungdo' },
	{ type: 'BATTLE', nameKey: 'board_tile_battle' },
	{ type: 'CITY', nameKey: 'board_tile_gwangju' },
	{ type: 'EVENT', nameKey: 'board_tile_reward' },
	{ type: 'CITY', nameKey: 'board_tile_daejeon' },
	{ type: 'BATTLE', nameKey: 'board_tile_monster' },
	{ type: 'CITY', nameKey: 'board_tile_suwon' },
	{ type: 'EVENT', nameKey: 'board_tile_event' }
];
