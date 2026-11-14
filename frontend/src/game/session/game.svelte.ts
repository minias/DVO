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

	// 감옥에서 앞으로 쉬어야 하는 턴 수
	jailTurns = $state(0);

	// 보유 아이템 (서버 인벤토리의 사본. 서버가 없으면 비어 있다)
	inventory = $state<{ itemId: string; qty: number }[]>([]);

	// 주사위를 굴릴 수 있는지 여부
	canRoll = $derived(this.phase === 'IDLE');

	// 영웅이 도시 칸에 서 있고 이동 중이 아닐 때만 구매할 수 있다
	canShop = $derived(this.phase === 'IDLE' && this.tiles[this.heroPosition - 1]?.type === 'CITY');

	// 서버의 아이템 구매·사용 결과를 반영한다. 위치는 건드리지 않고 능력치와 인벤토리만 교체한다.
	// 이동 중이거나 값이 깨졌으면 무시(false)한다.
	applyItemResult(save: PlayerStats, inventory: { itemId: string; qty: number }[]): boolean {
		if (this.phase !== 'IDLE') {
			return false;
		}
		const ints = [save.hp, save.maxHp, save.mp, save.maxMp, save.gold, save.level, save.exp];
		const valid =
			[...ints, save.weapon].every((v) => Number.isInteger(v) && v >= 0) &&
			save.maxHp >= 1 &&
			save.level >= 1 &&
			save.hp <= save.maxHp &&
			save.mp <= save.maxMp;
		if (!valid) {
			return false;
		}
		this.stats = {
			hp: save.hp,
			maxHp: save.maxHp,
			mp: save.mp,
			maxMp: save.maxMp,
			gold: save.gold,
			level: save.level,
			exp: save.exp,
			weapon: save.weapon
		};
		this.inventory = inventory.map((e) => ({ itemId: e.itemId, qty: e.qty }));
		return true;
	}

	// 주사위를 굴리고 이동을 시작한다. 이미 이동 중이면 무시한다.
	roll(random?: RandomSource): void {
		if (!this.canRoll) {
			return;
		}

		// 감옥에 갇혀 있으면 이동 없이 턴만 넘긴다
		if (this.jailTurns > 0) {
			this.jailTurns -= 1;
			this.turn += 1;
			this.lastTile = {
				type: 'TILE',
				tileId: this.heroPosition,
				startBonus: 0,
				outcome: { kind: 'JAIL_SKIP', remaining: this.jailTurns }
			};
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
		if (resolution.outcome.kind === 'JAIL') {
			this.jailTurns = resolution.outcome.skipTurns;
		}
		// 쓰러졌으면 출발 칸에서 부활한다
		if (resolution.respawn) {
			this.heroPosition = 1;
		}

		this.lastEvent = { type: 'MOVED', move };
		this.lastTile = { type: 'TILE', tileId: tile.id, startBonus, outcome: resolution.outcome };
	}

	// 저장용 스냅샷. 서버의 position 은 0부터 시작하므로 heroPosition(1부터) 에서 1을 뺀다.
	// 이동 중에는 확정된 칸만 저장한다 (turn 은 저장하지 않는다)
	snapshot(): PlayerStats & { position: number } {
		return { ...this.stats, position: this.heroPosition - 1 };
	}

	// 저장된 상태를 복원한다. 범위를 벗어난 값은 거부(false)해 깨진 세이브로 시작하지 않는다.
	// 이동 중이면 무시한다.
	restore(save: PlayerStats & { position: number }): boolean {
		if (this.phase !== 'IDLE') {
			return false;
		}
		const ints = [save.hp, save.maxHp, save.mp, save.maxMp, save.gold, save.level, save.exp];
		const valid =
			[...ints, save.weapon, save.position].every((v) => Number.isInteger(v) && v >= 0) &&
			save.maxHp >= 1 &&
			save.level >= 1 &&
			save.hp <= save.maxHp &&
			save.mp <= save.maxMp &&
			save.position < this.tiles.length;
		if (!valid) {
			return false;
		}

		// 서버 응답의 부가 필드(updatedAt 등)가 섞이지 않도록 필요한 값만 옮긴다
		this.stats = {
			hp: save.hp,
			maxHp: save.maxHp,
			mp: save.mp,
			maxMp: save.maxMp,
			gold: save.gold,
			level: save.level,
			exp: save.exp,
			weapon: save.weapon
		};
		this.heroPosition = save.position + 1;
		return true;
	}
}

export function createGameSession(): GameSession {
	return new GameSession();
}
