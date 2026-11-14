// src/game/player/player.logic.test.ts

import { describe, expect, it } from 'vitest';
import { GROWTH_CONFIG, PLAYER_CONFIG } from '$config/player.config';
import {
	attackBonus,
	changeGold,
	changeHp,
	changeMp,
	createInitialStats,
	expToNext,
	gainExp,
	isDefeated
} from './player.logic';

describe('createInitialStats', () => {
	it('설정값으로 시작 능력치를 만든다', () => {
		expect(createInitialStats()).toEqual({
			hp: PLAYER_CONFIG.INITIAL_HP,
			maxHp: PLAYER_CONFIG.MAX_HP,
			mp: PLAYER_CONFIG.INITIAL_MP,
			maxMp: PLAYER_CONFIG.MAX_MP,
			gold: PLAYER_CONFIG.INITIAL_GOLD,
			level: GROWTH_CONFIG.INITIAL_LEVEL,
			exp: 0,
			weapon: 0
		});
	});
});

describe('changeHp', () => {
	it('피해를 입으면 체력이 줄고 원본은 바뀌지 않는다', () => {
		const stats = createInitialStats();
		const next = changeHp(stats, -30);

		expect(next.hp).toBe(stats.maxHp - 30);
		expect(stats.hp).toBe(stats.maxHp);
	});

	it('체력은 0 미만으로 내려가지 않는다', () => {
		expect(changeHp(createInitialStats(), -9999).hp).toBe(0);
	});

	it('회복해도 최대 체력을 넘지 않는다', () => {
		expect(changeHp(createInitialStats(), 9999).hp).toBe(PLAYER_CONFIG.MAX_HP);
	});

	it('정수가 아니면 에러를 던진다', () => {
		expect(() => changeHp(createInitialStats(), 1.5)).toThrow();
	});
});

describe('changeMp', () => {
	it('0 ~ 최대 마나 범위로 제한된다', () => {
		const stats = createInitialStats();

		expect(changeMp(stats, -9999).mp).toBe(0);
		expect(changeMp(stats, 9999).mp).toBe(PLAYER_CONFIG.MAX_MP);
		expect(changeMp(stats, -10).mp).toBe(stats.maxMp - 10);
	});
});

describe('changeGold', () => {
	it('골드를 얻고 잃는다', () => {
		const earned = changeGold(createInitialStats(), 500);

		expect(earned.gold).toBe(PLAYER_CONFIG.INITIAL_GOLD + 500);
		expect(changeGold(earned, -200).gold).toBe(PLAYER_CONFIG.INITIAL_GOLD + 300);
	});

	it('골드는 0 미만으로 내려가지 않는다', () => {
		expect(changeGold(createInitialStats(), -9999).gold).toBe(0);
	});
});

describe('isDefeated', () => {
	it('체력이 0 이면 쓰러진 상태이다', () => {
		expect(isDefeated(createInitialStats())).toBe(false);
		expect(isDefeated(changeHp(createInitialStats(), -9999))).toBe(true);
	});
});

describe('성장', () => {
	it('경험치가 모자라면 레벨이 그대로이다', () => {
		const { stats, levelsGained } = gainExp(createInitialStats(), expToNext(1) - 1);

		expect(levelsGained).toBe(0);
		expect(stats).toMatchObject({ level: 1, exp: expToNext(1) - 1 });
	});

	it('레벨업하면 최대 HP·MP 가 오르고 모두 회복하며 남은 경험치가 이월된다', () => {
		const hurt = changeHp(createInitialStats(), -50);
		const { stats, levelsGained } = gainExp(hurt, expToNext(1) + 5);

		expect(levelsGained).toBe(1);
		expect(stats.level).toBe(2);
		expect(stats.exp).toBe(5);
		expect(stats.maxHp).toBe(PLAYER_CONFIG.MAX_HP + GROWTH_CONFIG.MAX_HP_PER_LEVEL);
		expect(stats.hp).toBe(stats.maxHp);
		expect(stats.mp).toBe(stats.maxMp);
	});

	it('경험치가 많으면 여러 레벨이 한 번에 오른다', () => {
		const { stats, levelsGained } = gainExp(createInitialStats(), expToNext(1) + expToNext(2));

		expect(levelsGained).toBe(2);
		expect(stats.level).toBe(3);
	});

	it('최대 레벨에서는 더 오르지 않는다', () => {
		const { stats } = gainExp(createInitialStats(), 999999);

		expect(stats.level).toBe(GROWTH_CONFIG.MAX_LEVEL);
		expect(stats.exp).toBe(0);
	});

	it('공격력 보정은 레벨마다 늘어난다', () => {
		expect(attackBonus(1)).toBe(0);
		expect(attackBonus(3)).toBe(2 * GROWTH_CONFIG.ATTACK_PER_LEVEL);
	});
});
