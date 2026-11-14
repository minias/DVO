// src/game/board/board.model.ts

export type TileType = 'START' | 'CITY' | 'EVENT' | 'BATTLE' | 'BOSS' | 'JAIL';

export interface BoardTile {
	id: number;

	type: TileType;

	// 번역 키 (messages/*.json 의 board_tile_*). 화면 문구는 TextResolver 로 변환한다
	nameKey: string;

	x: number;

	y: number;
}
