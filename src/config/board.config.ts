// src/config/board.config.ts

export const BOARD_CONFIG = {
	TILE_SIZE: 80,
	OFFSET_X: 20,
	OFFSET_Y: 20,
	EDGE_COUNT: 10,
	SHOW_GRID: true,

	// 영웅이 한 칸 이동하는 데 걸리는 연출 시간 (밀리초)
	MOVE_STEP_MS: 200
} as const;
