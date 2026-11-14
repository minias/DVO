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
