// src/config/render.config.ts

export const RENDER_CONFIG = {
	// 캔버스 글꼴 스택: 특정 OS 에만 있는 폰트에 의존하지 않도록 OS별 한글 폰트와 폴백을 함께 지정한다
	// (Windows: Segoe UI / Malgun Gothic, macOS: Apple SD Gothic Neo, Linux: Noto Sans CJK KR)
	FONT_FAMILY:
		'"Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR", system-ui, sans-serif',

	// 고해상도(Retina 등) 화면에서 캔버스 해상도 배율의 상한 (과도한 메모리 사용 방지)
	MAX_DEVICE_PIXEL_RATIO: 3,

	// 칸 효과 강조 연출 길이(ms): 도착 칸이 결과 색으로 번쩍였다가 사라진다
	TILE_FLASH_MS: 900,

	// 칸 효과 결과별 강조 색 (긍정=초록·금색, 부정=빨강, 도시=파랑, 감옥=회색)
	TILE_FLASH_COLORS: {
		positive: '#22c55e',
		reward: '#facc15',
		negative: '#ef4444',
		city: '#38bdf8',
		jail: '#9ca3af'
	}
} as const;
