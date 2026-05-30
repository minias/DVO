// src/game/board/board.model.ts

export type TileType =
	| 'START'
	| 'CITY'
	| 'EVENT'
	| 'BATTLE'
	| 'BOSS'
	| 'JAIL';

export interface BoardTile {
	id: number;

	type: TileType;

	name: string;

	x: number;

	y: number;
}