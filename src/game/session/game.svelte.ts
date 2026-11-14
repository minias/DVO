// src/game/session/game.svelte.ts

import { createBoard } from '../board/board.generator';
import type { BoardTile } from '../board/board.model';
import { rollDice } from '../dice/dice.service';
import type { DiceResult, RandomSource } from '../dice/dice.model';
import type { PlayerStats } from '../player/player.model';
import { TILE_CONFIG } from '$config/tile.config';
import { changeGold, createInitialStats } from '../player/player.logic';
import type { GameEvent, MoveResult, TileEvent, TurnPhase } from './session.model';
import { calculateMove } from './turn.logic';
import { resolveTile } from './tile.logic';

// 게임 한 판의 상태.
// 화면(캔버스·UI)은 이 상태를 읽기만 하고, 상태 변경은 roll / completeMove 로만 한다.
export class GameSession {
	// 보드 타일 (생성 후 변하지 않음)
	readonly tiles: BoardTile[] = createBoard();

	// 영웅이 확정적으로 서 있는 칸 (도착이 완료된 시점에 갱신)
	heroPosition = $state(1);

	// 현재 턴 단계
	phase = $state<TurnPhase>('IDLE');

	// 현재 턴 번호
	turn = $state(1);

	// 플레이어 능력치 (HP/MP/골드). 변경은 player.logic 의 순수 함수 결과로 통째로 교체한다.
	stats = $state<PlayerStats>(createInitialStats());

	// 마지막 주사위 결과 (아직 굴리지 않았으면 null)
	lastRoll = $state<DiceResult | null>(null);

	// 연출이 필요한 이동 (렌더러가 소비하고 completeMove 로 끝낸다)
	pendingMove = $state<MoveResult | null>(null);

	// 마지막으로 발생한 사건 (이벤트 타일·전투 확장용)
	lastEvent = $state<GameEvent | null>(null);

	// 마지막 칸 효과 결과 (화면의 결과 문구용. 굴림이 시작되면 지운다)
	lastTile = $state<TileEvent | null>(null);

	// 주사위를 굴릴 수 있는지 여부
	canRoll = $derived(this.phase === 'IDLE');

	// 주사위를 굴리고 이동을 시작한다. 이미 이동 중이면 무시한다.
	roll(random?: RandomSource): void {
		if (!this.canRoll) {
			return;
		}

		const result = rollDice({}, random);
		const move = calculateMove(this.heroPosition, result.total, this.tiles.length);

		this.lastTile = null;
		this.lastRoll = result;
		this.pendingMove = move;
		this.phase = 'MOVING';
		this.lastEvent = { type: 'ROLLED', values: result.values, total: result.total };
	}

	// 이동 연출이 끝났을 때 호출한다. 도착 칸을 확정하고 다음 턴으로 넘어간다.
	completeMove(random?: RandomSource): void {
		if (this.phase !== 'MOVING' || !this.pendingMove) {
			return;
		}

		const move = this.pendingMove;

		this.heroPosition = move.to;
		this.pendingMove = null;
		this.phase = 'IDLE';
		this.turn += 1;

		// 출발 지점을 지났으면 보상을 받고, 도착한 칸의 효과를 처리한다
		const startBonus = move.passedStart ? TILE_CONFIG.START_PASS_GOLD : 0;
		const tile = this.tiles[move.to - 1];
		const resolution = resolveTile(tile.type, changeGold(this.stats, startBonus), random);

		this.stats = resolution.stats;
		// 쓰러졌으면 출발 칸에서 부활한다
		if (resolution.respawn) {
			this.heroPosition = 1;
		}

		this.lastEvent = { type: 'MOVED', move };
		this.lastTile = { type: 'TILE', tileId: tile.id, startBonus, outcome: resolution.outcome };
	}
}

export function createGameSession(): GameSession {
	return new GameSession();
}
