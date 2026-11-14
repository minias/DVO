// src/config/board.config.ts

export const BOARD_CONFIG = {
	TILE_SIZE: 80,
	OFFSET_X: 20,
	OFFSET_Y: 20,
	EDGE_COUNT: 10,
	SHOW_GRID: true,

	// 영웅이 한 칸 이동하는 데 걸리는 연출 시간 (밀리초)
	MOVE_STEP_MS: 200,

	// 화면 하단 UI(턴·상태창·버튼)가 차지하는 높이 (CSS 픽셀). 보드는 이 영역을 제외한 위쪽에 그린다.
	// 하단 UI 구성이 바뀌면 실제 화면을 보고 조정한다.
	BOTTOM_RESERVED_PX: 200
} as const;
