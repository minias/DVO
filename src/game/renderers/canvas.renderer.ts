// src/game/renderers/canvas.renderer.ts

import { BOARD_CONFIG } from '$config/board.config';

import type { BoardTile } from '../board/board.model';
import type { Renderer } from '../core/renderer.interface';
import { InputManager } from '../input/input.manager';
import type { GameSession } from '../session/game.svelte';
import type { MoveResult } from '../session/session.model';

export class CanvasRenderer implements Renderer {
	private canvas!: HTMLCanvasElement;
	private ctx!: CanvasRenderingContext2D;

	private readonly input = new InputManager();

	private spacePressed = false;

	// 렌더러가 읽어 그릴 게임 상태 (상태 변경은 세션의 roll / completeMove 로만 한다)
	private session: GameSession | null = null;

	// 현재 진행 중인 이동 연출 (같은 pendingMove 에 대해 중복 시작을 막기 위해 참조를 보관)
	private animatingMove: MoveResult | null = null;
	private animationStartMs = 0;

	// 게임 세션을 연결한다 (연결 전에는 보드를 그리지 않는다)
	public bind(session: GameSession): void {
		this.session = session;
		this.animatingMove = null;
	}

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

		const session = this.session;
		if (!session) {
			return;
		}

		const tiles = session.tiles;

		// =========================
		// INPUT → 세션 호출 (누르는 순간 한 번만)
		// =========================
		if (this.input.isPressed('Space') && !this.spacePressed) {
			this.spacePressed = true;

			if (session.canRoll) {
				session.roll();
			}
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
			Math.min(availableWidth / BOARD_CONFIG.EDGE_COUNT, availableHeight / BOARD_CONFIG.EDGE_COUNT)
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
			this.ctx.fillText(String(tile.id), x + tileSize * 0.08, y + tileSize * 0.2);

			this.ctx.font = `${textFontSize}px Segoe UI`;
			this.ctx.fillText(tile.type, x + tileSize * 0.08, y + tileSize * 0.45);
			this.ctx.fillText(tile.name, x + tileSize * 0.08, y + tileSize * 0.7);
		}

		// =========================
		// HERO RENDER (STATE ONLY)
		// =========================
		const heroPoint = this.resolveHeroPoint(session, tiles);

		if (heroPoint) {
			const heroX = startX + heroPoint.x * scale + tileSize / 2;
			const heroY = startY + heroPoint.y * scale + tileSize / 2;

			this.ctx.beginPath();
			this.ctx.arc(heroX, heroY, Math.max(8, tileSize * 0.18), 0, Math.PI * 2);

			this.ctx.fillStyle = '#3b82f6';
			this.ctx.fill();
			this.ctx.closePath();
		}
	}

	// 영웅을 그릴 보드 좌표를 계산한다. 이동 연출이 끝나면 세션에 완료를 알린다.
	private resolveHeroPoint(
		session: GameSession,
		tiles: BoardTile[]
	): { x: number; y: number } | null {
		const move = session.phase === 'MOVING' ? session.pendingMove : null;

		if (!move) {
			this.animatingMove = null;
			return this.tilePoint(tiles, session.heroPosition);
		}

		// 새 pendingMove 가 들어오면 연출 시작 시각을 기록한다
		if (this.animatingMove !== move) {
			this.animatingMove = move;
			this.animationStartMs = performance.now();
		}

		const elapsed = performance.now() - this.animationStartMs;
		const progress = elapsed / BOARD_CONFIG.MOVE_STEP_MS;

		// 연출 종료: 도착 칸을 확정하고 세션에 정확히 한 번 알린다
		if (progress >= move.steps) {
			this.animatingMove = null;
			session.completeMove();
			return this.tilePoint(tiles, move.to);
		}

		// 한 칸씩 이동하며 다음 칸으로 부드럽게 보간한다 (원형 보드: 마지막 칸 다음은 1번)
		const stepIndex = Math.floor(progress);
		const fraction = progress - stepIndex;
		const current = this.tilePoint(tiles, this.wrapId(move.from + stepIndex, tiles.length));
		const next = this.tilePoint(tiles, this.wrapId(move.from + stepIndex + 1, tiles.length));

		if (!current || !next) {
			return current;
		}

		return {
			x: current.x + (next.x - current.x) * fraction,
			y: current.y + (next.y - current.y) * fraction
		};
	}

	// 칸 번호(1 기반)를 원형으로 감싼다
	private wrapId(id: number, length: number): number {
		return ((id - 1) % length) + 1;
	}

	private tilePoint(tiles: BoardTile[], id: number): { x: number; y: number } | null {
		const tile = tiles.find((candidate) => candidate.id === id);
		return tile ? { x: tile.x, y: tile.y } : null;
	}

	public resize(width: number, height: number): void {
		this.canvas.width = width;
		this.canvas.height = height;
	}

	public destroy(): void {
		this.input.destroy();
	}
}
