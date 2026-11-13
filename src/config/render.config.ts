// src/config/render.config.ts

export const RENDER_CONFIG = {
	// 캔버스 글꼴 스택: 특정 OS 에만 있는 폰트에 의존하지 않도록 OS별 한글 폰트와 폴백을 함께 지정한다
	// (Windows: Segoe UI / Malgun Gothic, macOS: Apple SD Gothic Neo, Linux: Noto Sans CJK KR)
	FONT_FAMILY:
		'"Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR", system-ui, sans-serif',

	// 고해상도(Retina 등) 화면에서 캔버스 해상도 배율의 상한 (과도한 메모리 사용 방지)
	MAX_DEVICE_PIXEL_RATIO: 3
} as const;
