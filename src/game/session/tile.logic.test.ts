// src/game/session/tile.logic.test.ts

import { describe, expect, it } from 'vitest';
import { TILE_CONFIG } from '$config/tile.config';
import { createInitialStats } from '../player/player.logic';
import { GameSession } from './game.svelte';
import { resolveTile } from './tile.logic';

// 항상 같은 값을 돌려주는 난수원 (0 = 최솟값 쪽, 0.999 = 최댓값 쪽)
const low = () => 0;
const high = () => 0.999;

describe('resolveTile', () => {
	it('출발·도시 칸은 아무 일도 일어나지 않는다', () => {
		const stats = createInitialStats();

		for (const type of ['START', 'CITY'] as const) {
			const result = resolveTile(type, stats, low);
			expect(result.outcome).toEqual({ kind: 'NONE' });
			expect(result.stats).toBe(stats);
			expect(result.respawn).toBe(false);
		}
	});

	it('이벤트: 첫 효과(골드 획득)는 MIN 만큼 골드를 준다', () => {
		const result = resolveTile('EVENT', createInitialStats(), low);

		expect(result.outcome).toMatchObject({ kind: 'EVENT', effect: 'GOLD_GAIN', amount: 10 });
		expect(result.stats.gold).toBe(10);
	});

	it('이벤트: 마지막 효과(HP 피해)는 MAX 만큼 체력을 깎는다', () => {
		const result = resolveTile('EVENT', createInitialStats(), high);

		expect(result.outcome).toMatchObject({ kind: 'EVENT', effect: 'HP_DAMAGE', amount: 30 });
		expect(result.stats.hp).toBe(70);
	});

	it('골드가 부족하면 실제로 잃은 만큼만 보고한다', () => {
		// 난수 순서: 효과 선택(GOLD_LOSS), 변화량
		const seq = [0.3, 0.999];
		let i = 0;
		const result = resolveTile('EVENT', createInitialStats(), () => seq[i++] ?? 0);

		expect(result.outcome).toMatchObject({ effect: 'GOLD_LOSS', amount: 0 });
		expect(result.stats.gold).toBe(0);
	});

	it('전투 승리: 몬스터를 쓰러뜨리면 골드를 받는다', () => {
		const result = resolveTile('BATTLE', createInitialStats(), high);

		expect(result.outcome).toMatchObject({ kind: 'BATTLE', boss: false, won: true });
		expect(result.stats.gold).toBe(TILE_CONFIG.MONSTER.REWARD_MAX);
		expect(result.respawn).toBe(false);
	});

	it('전투 패배(HP 0): 골드 절반을 잃고 체력을 회복해 부활 표시를 한다', () => {
		const weak = { ...createInitialStats(), hp: 1, gold: 100 };
		// 영웅 공격은 최소, 몬스터 공격은 최대: 영웅이 먼저 쓰러진다
		const result = resolveTile('BATTLE', weak, low);

		expect(result.outcome).toMatchObject({ kind: 'BATTLE', won: false, defeated: true });
		expect(result.stats.hp).toBe(weak.maxHp);
		expect(result.stats.gold).toBe(50);
		expect(result.respawn).toBe(true);
	});

	it('보스는 강하다 (양쪽 모두 최대 공격력이면 영웅이 진다)', () => {
		const result = resolveTile('BOSS', createInitialStats(), high);

		expect(result.outcome).toMatchObject({ kind: 'BATTLE', boss: true, won: false });
	});

	it('원본 능력치는 바뀌지 않는다', () => {
		const stats = createInitialStats();
		resolveTile('EVENT', stats, high);

		expect(stats).toEqual(createInitialStats());
	});
});

describe('GameSession 칸 효과 연동', () => {
	it('이동을 마치면 도착 칸 효과가 반영되고 결과가 기록된다', () => {
		const session = new GameSession();
		// 2번(CITY) -> 5번(BATTLE) 칸 근처로 직접 이동 상태를 만든다
		session.heroPosition = 1;
		session.phase = 'MOVING';
		session.pendingMove = { from: 1, to: 5, steps: 4, passedStart: false };

		session.completeMove(high);

		expect(session.heroPosition).toBe(5);
		expect(session.lastTile?.outcome.kind).toBe('BATTLE');
		expect(session.stats.gold).toBeGreaterThan(0);
	});

	it('출발 지점을 지나면 보상 골드를 받는다', () => {
		const session = new GameSession();
		session.heroPosition = 35;
		session.phase = 'MOVING';
		// 3번 칸(EVENT) 은 아닌 2번 칸(CITY)으로 도착해 보상만 확인한다
		session.pendingMove = { from: 35, to: 2, steps: 3, passedStart: true };

		session.completeMove(low);

		expect(session.stats.gold).toBe(TILE_CONFIG.START_PASS_GOLD);
		expect(session.lastTile?.startBonus).toBe(TILE_CONFIG.START_PASS_GOLD);
	});

	it('쓰러지면 출발 칸(1번)으로 돌아간다', () => {
		const session = new GameSession();
		session.stats = { ...session.stats, hp: 1 };
		session.heroPosition = 1;
		session.phase = 'MOVING';
		// 9번 칸 부근 BATTLE 칸을 찾아 이동시킨다
		const battle = session.tiles.find((t) => t.type === 'BATTLE')!;
		session.pendingMove = { from: 1, to: battle.id, steps: battle.id - 1, passedStart: false };

		session.completeMove(low);

		expect(session.heroPosition).toBe(1);
		expect(session.stats.hp).toBe(session.stats.maxHp);
	});
});
