// src/game/player/player.logic.ts

import { PLAYER_CONFIG } from '$config/player.config';
import type { PlayerStats } from './player.model';

// 설정값으로 시작 능력치를 만든다
export function createInitialStats(): PlayerStats {
	return {
		hp: PLAYER_CONFIG.INITIAL_HP,
		maxHp: PLAYER_CONFIG.MAX_HP,
		mp: PLAYER_CONFIG.INITIAL_MP,
		maxMp: PLAYER_CONFIG.MAX_MP,
		gold: PLAYER_CONFIG.INITIAL_GOLD
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
