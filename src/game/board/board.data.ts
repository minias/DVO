// src/game/board/board.data.ts

import type { TileType } from './board.model';

export interface TileDefinition {
	type: TileType;
	name: string;
}
export const BOARD_TILE_DEFINITIONS: TileDefinition[] = [

	// =========================
	// [0~9] TOP (10)
	// =========================
	{ type: 'START', name: 'START' },
	{ type: 'CITY', name: '울산' },
	{ type: 'EVENT', name: '이벤트' },
	{ type: 'CITY', name: '부산' },
	{ type: 'BATTLE', name: '전투' },
	{ type: 'CITY', name: '대구' },
	{ type: 'EVENT', name: '보상' },
	{ type: 'CITY', name: '포항' },
	{ type: 'BATTLE', name: '몬스터' },
	{ type: 'EVENT', name: '축복' },

	// =========================
	// [10~17] RIGHT (8)
	// =========================
	{ type: 'CITY', name: '대전' },
	{ type: 'EVENT', name: '함정' },
	{ type: 'CITY', name: '수원' },
	{ type: 'BATTLE', name: '전투' },
	{ type: 'CITY', name: '인천' },
	{ type: 'BOSS', name: '보스' },
	{ type: 'EVENT', name: '상자' },
	{ type: 'CITY', name: '서울' },

	// =========================
	// [18~25] BOTTOM (8)
	// =========================
	{ type: 'CITY', name: '춘천' },
	{ type: 'BATTLE', name: '전투' },
	{ type: 'CITY', name: '강릉' },
	{ type: 'EVENT', name: '보너스' },
	{ type: 'CITY', name: '경주' },
	{ type: 'CITY', name: '창원' },
	{ type: 'EVENT', name: '행운' },
	{ type: 'BATTLE', name: '보스전' },

	// =========================
	// [26~35] LEFT (10)
	// =========================
	{ type: 'CITY', name: '제주' },
	{ type: 'EVENT', name: '황금상자' },
	{ type: 'CITY', name: '울릉도' },
	{ type: 'BATTLE', name: '전투' },
	{ type: 'CITY', name: '광주' },
	{ type: 'EVENT', name: '보상' },
	{ type: 'CITY', name: '대전' },
	{ type: 'BATTLE', name: '몬스터' },
	{ type: 'CITY', name: '수원' },
	{ type: 'EVENT', name: '이벤트' }
];