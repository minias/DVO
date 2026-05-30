// src/game/core/renderer.interface.ts

export interface Renderer {
	initialize(canvas: HTMLCanvasElement): void;

	render(deltaTime: number): void;

	resize(width: number, height: number): void;

	destroy(): void;
}