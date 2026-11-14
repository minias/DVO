// src/game/player/player.logic.ts

import { GROWTH_CONFIG, PLAYER_CONFIG } from '$config/player.config';
import type { PlayerStats } from './player.model';

// 설정값으로 시작 능력치를 만든다
export function createInitialStats(): PlayerStats {
	return {
		hp: PLAYER_CONFIG.INITIAL_HP,
		maxHp: PLAYER_CONFIG.MAX_HP,
		mp: PLAYER_CONFIG.INITIAL_MP,
		maxMp: PLAYER_CONFIG.MAX_MP,
		gold: PLAYER_CONFIG.INITIAL_GOLD,
		level: GROWTH_CONFIG.INITIAL_LEVEL,
		exp: 0,
		weapon: 0
	};
}

// 변화량은 정수여야 한다 (잘못된 값은 조용히 넘기지 않고 실패시킨다)
function assertInteger(delta: number): void {
	if (!Number.isInteger(delta)) {
		throw new Error(`Invalid delta: ${delta}`);
	}
}

// 값을 min ~ max 범위로 제한한다
function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

// 체력을 delta 만큼 바꾼다 (피해는 음수, 회복은 양수). 0 ~ maxHp 로 제한된다.
export function changeHp(stats: PlayerStats, delta: number): PlayerStats {
	assertInteger(delta);

	return { ...stats, hp: clamp(stats.hp + delta, 0, stats.maxHp) };
}

// 마나를 delta 만큼 바꾼다. 0 ~ maxMp 로 제한된다.
export function changeMp(stats: PlayerStats, delta: number): PlayerStats {
	assertInteger(delta);

	return { ...stats, mp: clamp(stats.mp + delta, 0, stats.maxMp) };
}

// 골드를 delta 만큼 바꾼다. 0 미만으로는 내려가지 않는다.
export function changeGold(stats: PlayerStats, delta: number): PlayerStats {
	assertInteger(delta);

	return { ...stats, gold: Math.max(0, stats.gold + delta) };
}

// 체력이 0 이면 쓰러진 상태이다
export function isDefeated(stats: PlayerStats): boolean {
	return stats.hp <= 0;
}

// 다음 레벨까지 필요한 경험치
export function expToNext(level: number): number {
	return level * GROWTH_CONFIG.EXP_PER_LEVEL;
}

// 레벨·무기 단계에 따른 영웅 공격력 보정 (레벨 1·무기 0 단계는 0)
export function attackBonus(level: number, weapon = 0): number {
	return (
		(level - GROWTH_CONFIG.INITIAL_LEVEL) * GROWTH_CONFIG.ATTACK_PER_LEVEL +
		weapon * GROWTH_CONFIG.ATTACK_PER_WEAPON_TIER
	);
}

// 경험치를 얻는다. 레벨업마다 최대 HP·MP 가 오르고 HP·MP 를 모두 회복한다.
// 최대 레벨에 도달하면 경험치는 더 쌓이지 않는다.
export function gainExp(
	stats: PlayerStats,
	amount: number
): { stats: PlayerStats; levelsGained: number } {
	assertInteger(amount);

	let next = { ...stats, exp: stats.exp + Math.max(0, amount) };
	let levelsGained = 0;

	while (next.level < GROWTH_CONFIG.MAX_LEVEL && next.exp >= expToNext(next.level)) {
		const maxHp = next.maxHp + GROWTH_CONFIG.MAX_HP_PER_LEVEL;
		const maxMp = next.maxMp + GROWTH_CONFIG.MAX_MP_PER_LEVEL;
		next = {
			...next,
			exp: next.exp - expToNext(next.level),
			level: next.level + 1,
			maxHp,
			maxMp,
			hp: maxHp,
			mp: maxMp
		};
		levelsGained++;
	}

	if (next.level >= GROWTH_CONFIG.MAX_LEVEL) {
		next = { ...next, exp: 0 };
	}

	return { stats: next, levelsGained };
}
