// src/game/session/game.save.test.ts

import { describe, expect, it } from 'vitest';
import { createGameSession } from './game.svelte';

const SAVE = {
	hp: 80,
	maxHp: 100,
	mp: 10,
	maxMp: 20,
	gold: 150,
	level: 2,
	exp: 5,
	weapon: 1,
	position: 3
};

describe('GameSession 저장·복원', () => {
	it('복원한 뒤 스냅샷은 같은 값을 돌려준다 (칸 번호는 0부터)', () => {
		const session = createGameSession();
		expect(session.restore(SAVE)).toBe(true);
		expect(session.heroPosition).toBe(4);
		expect(session.snapshot()).toEqual(SAVE);
	});

	it('서버 응답의 부가 필드는 상태에 섞이지 않는다', () => {
		const session = createGameSession();
		session.restore({ ...SAVE, updatedAt: '2026-11-14T00:00:00Z' } as typeof SAVE);
		expect(session.stats).not.toHaveProperty('updatedAt');
	});

	it('범위를 벗어난 세이브는 거부하고 상태를 바꾸지 않는다', () => {
		const session = createGameSession();
		const before = session.snapshot();
		expect(session.restore({ ...SAVE, hp: 101 })).toBe(false);
		expect(session.restore({ ...SAVE, position: session.tiles.length })).toBe(false);
		expect(session.restore({ ...SAVE, level: 0 })).toBe(false);
		expect(session.restore({ ...SAVE, gold: -1 })).toBe(false);
		expect(session.snapshot()).toEqual(before);
	});

	it('이동 중에는 복원하지 않는다', () => {
		const session = createGameSession();
		session.roll();
		expect(session.restore(SAVE)).toBe(false);
	});
});

describe('GameSession 아이템 결과 반영', () => {
	const STATS = { hp: 90, maxHp: 100, mp: 20, maxMp: 20, gold: 70, level: 2, exp: 5, weapon: 1 };

	it('능력치와 인벤토리를 교체하고 위치는 유지한다', () => {
		const session = createGameSession();
		session.restore(SAVE);
		expect(session.applyItemResult(STATS, [{ itemId: 'potion_hp', qty: 2 }])).toBe(true);
		expect(session.stats.gold).toBe(70);
		expect(session.inventory).toEqual([{ itemId: 'potion_hp', qty: 2 }]);
		expect(session.heroPosition).toBe(4);
	});

	it('깨진 값이나 이동 중이면 무시한다', () => {
		const session = createGameSession();
		expect(session.applyItemResult({ ...STATS, hp: 999 }, [])).toBe(false);
		session.roll();
		expect(session.applyItemResult(STATS, [])).toBe(false);
	});
});
