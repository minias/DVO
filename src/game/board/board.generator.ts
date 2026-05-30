// src/game/board/board.generator.ts

import { BOARD_CONFIG } from '$config/board.config';
import { BOARD_TILE_DEFINITIONS } from './board.data';
import type { BoardTile } from './board.model';

export function createBoard(): BoardTile[] {
	const size = BOARD_CONFIG.TILE_SIZE;
	const edge = BOARD_CONFIG.EDGE_COUNT;

	const positions: Array<{ x: number; y: number }> = [];
	console.log('DEFINITIONS LENGTH:', BOARD_TILE_DEFINITIONS.length);
	
	// 상단
	for (let x = 0; x < edge; x++) {
		positions.push({
			x,
			y: 0
		});
	}

	// 우측
	for (let y = 1; y < edge; y++) {
		positions.push({
			x: edge - 1,
			y
		});
	}

	// 하단
	for (let x = edge - 2; x >= 0; x--) {
		positions.push({
			x,
			y: edge - 1
		});
	}

	// 좌측
	for (let y = edge - 2; y >= 1; y--) {
		positions.push({
			x: 0,
			y
		});
	}
 
	const tiles: BoardTile[] = positions.map((position, index) => {
		const definition = BOARD_TILE_DEFINITIONS[index];
		if (BOARD_TILE_DEFINITIONS.length < positions.length) {
			throw new Error(
				`Board definition count mismatch. definitions=${BOARD_TILE_DEFINITIONS.length}, positions=${positions.length}`
			);
		}
		return {
			id: index + 1,
			type: definition.type,
			name: definition.name,
			x: position.x * size,
			y: position.y * size
		};
	});

	return tiles;
}