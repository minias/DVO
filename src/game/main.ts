// src/game/main.ts

import { CanvasRenderer } from './renderers/canvas.renderer';

function bootstrap() {
	const canvas = document.querySelector('canvas');

	if (!canvas) {
		throw new Error('Canvas element not found');
	}

	const renderer = new CanvasRenderer();

	// 1. 반드시 먼저 initialize
	renderer.initialize(canvas);

	// 2. resize 초기 설정
	renderer.resize(window.innerWidth, window.innerHeight);

	// 3. resize 대응
	window.addEventListener('resize', () => {
		renderer.resize(window.innerWidth, window.innerHeight);
	});

	// 4. game loop (중요: bind 문제 방지)
	function loop(time: number) {
		renderer.render(time);
		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}

bootstrap();