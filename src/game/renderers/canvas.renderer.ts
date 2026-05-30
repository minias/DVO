// src/game/renderers/canvas.renderer.ts

import { BOARD_CONFIG } from '$config/board.config';

import { createBoard } from '../board/board.generator';
import type { Renderer } from '../core/renderer.interface';
import { InputManager } from '../input/input.manager';

type HeroState = {
	position: number;
};

export class CanvasRenderer implements Renderer {
	private canvas!: HTMLCanvasElement;
	private ctx!: CanvasRenderingContext2D;

	private readonly input = new InputManager();

	private spacePressed = false;

	// ✅ HERO를 renderer state로 격리 (임시 transition)
	private hero: HeroState = {
		position: 1
	};

	public initialize(canvas: HTMLCanvasElement): void {
		this.canvas = canvas;

		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Canvas context unavailable');
		}

		this.ctx = context;

		this.input.initialize();
	}

	public render(_deltaTime: number): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.fillStyle = '#111827';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		const tiles = createBoard();

		// =========================
		// INPUT → STATE UPDATE (임시 유지)
		// =========================
		if (this.input.isPressed('Space') && !this.spacePressed) {
			this.spacePressed = true;

			this.hero.position += 1;

			if (this.hero.position > tiles.length) {
				this.hero.position = 1;
			}

			console.log(`Hero Position: ${this.hero.position}`);
		}

		if (!this.input.isPressed('Space')) {
			this.spacePressed = false;
		}

		// =========================
		// BOARD CALC
		// =========================
		const availableWidth = this.canvas.width * 0.8;
		const availableHeight = this.canvas.height * 0.8;

		const tileSize = Math.floor(
			Math.min(
				availableWidth / BOARD_CONFIG.EDGE_COUNT,
				availableHeight / BOARD_CONFIG.EDGE_COUNT
			)
		);

		const boardWidth = BOARD_CONFIG.EDGE_COUNT * tileSize;
		const boardHeight = BOARD_CONFIG.EDGE_COUNT * tileSize;

		const startX = (this.canvas.width - boardWidth) / 2;
		const startY = (this.canvas.height - boardHeight) / 2;

		const scale = tileSize / BOARD_CONFIG.TILE_SIZE;

		const idFontSize = Math.max(10, Math.floor(tileSize * 0.15));
		const textFontSize = Math.max(9, Math.floor(tileSize * 0.13));

		// =========================
		// TILE RENDER
		// =========================
		for (const tile of tiles) {
			const x = startX + tile.x * scale;
			const y = startY + tile.y * scale;

			this.ctx.strokeStyle = '#ffffff';
			this.ctx.strokeRect(x, y, tileSize, tileSize);

			this.ctx.fillStyle = '#ffffff';

			this.ctx.font = `${idFontSize}px Segoe UI`;
			this.ctx.fillText(String(tile.id), x + tileSize * 0.08, y + tileSize * 0.20);

			this.ctx.font = `${textFontSize}px Segoe UI`;
			this.ctx.fillText(tile.type, x + tileSize * 0.08, y + tileSize * 0.45);
			this.ctx.fillText(tile.name, x + tileSize * 0.08, y + tileSize * 0.70);
		}

		// =========================
		// HERO RENDER (STATE ONLY)
		// =========================
		const heroTile = tiles.find(
			(tile) => tile.id === this.hero.position
		);

		if (heroTile) {
			const heroX = startX + heroTile.x * scale + tileSize / 2;
			const heroY = startY + heroTile.y * scale + tileSize / 2;

			this.ctx.beginPath();
			this.ctx.arc(
				heroX,
				heroY,
				Math.max(8, tileSize * 0.18),
				0,
				Math.PI * 2
			);

			this.ctx.fillStyle = '#3b82f6';
			this.ctx.fill();
			this.ctx.closePath();
		}
	}

	public resize(width: number, height: number): void {
		this.canvas.width = width;
		this.canvas.height = height;
	}

	public destroy(): void {
		this.input.destroy();
	}
}