// src/game/session/tile.logic.ts

import { GROWTH_CONFIG } from '$config/player.config';
import { TILE_CONFIG } from '$config/tile.config';
import type { RandomSource } from '../dice/dice.model';
import type { TileType } from '../board/board.model';
import type { PlayerStats } from '../player/player.model';
import { attackBonus, changeGold, changeHp, gainExp, isDefeated } from '../player/player.logic';
import type { BattleOutcome, EventEffect, EventOutcome, TileOutcome } from './session.model';

// 칸 효과 처리 결과: 바뀐 능력치와 일어난 일, 부활(출발 칸 복귀) 여부
export interface TileResolution {
	stats: PlayerStats;
	outcome: TileOutcome;
	// true 이면 호출자가 영웅을 출발 칸으로 되돌려야 한다
	respawn: boolean;
}

// min~max(양끝 포함) 사이 정수
function randomInt(min: number, max: number, random: RandomSource): number {
	return min + Math.floor(random() * (max - min + 1));
}

// HP 가 0 이면 골드 일부를 잃고 체력을 모두 회복한다 (부활은 호출자가 위치로 처리)
function applyDefeat(stats: PlayerStats): {
	stats: PlayerStats;
	defeated: boolean;
	goldLost: number;
} {
	if (!isDefeated(stats)) {
		return { stats, defeated: false, goldLost: 0 };
	}

	const goldLost = Math.floor(stats.gold * TILE_CONFIG.DEFEAT_GOLD_LOSS_RATIO);
	const revived = changeHp(changeGold(stats, -goldLost), stats.maxHp);

	return { stats: revived, defeated: true, goldLost };
}

// 이벤트 칸: 효과 하나를 뽑아 적용한다
function resolveEvent(stats: PlayerStats, random: RandomSource): TileResolution {
	const effects = TILE_CONFIG.EVENT.EFFECTS as readonly EventEffect[];
	const effect = effects[Math.floor(random() * effects.length)];
	const rolled = randomInt(TILE_CONFIG.EVENT.MIN, TILE_CONFIG.EVENT.MAX, random);

	const delta: Record<EventEffect, () => PlayerStats> = {
		GOLD_GAIN: () => changeGold(stats, rolled),
		GOLD_LOSS: () => changeGold(stats, -rolled),
		HP_HEAL: () => changeHp(stats, rolled),
		HP_DAMAGE: () => changeHp(stats, -rolled)
	};
	const changed = delta[effect]();

	// 한계(0, 최대치)에 막혀 실제로 바뀐 양을 알려준다
	const amount =
		effect === 'GOLD_GAIN' || effect === 'GOLD_LOSS'
			? Math.abs(changed.gold - stats.gold)
			: Math.abs(changed.hp - stats.hp);

	const defeat = applyDefeat(changed);
	const outcome: EventOutcome = {
		kind: 'EVENT',
		effect,
		amount,
		defeated: defeat.defeated,
		goldLost: defeat.goldLost
	};

	return { stats: defeat.stats, outcome, respawn: defeat.defeated };
}

// 전투 칸·보스 칸: 한쪽이 쓰러질 때까지 번갈아 공격하는 자동 전투 (영웅이 먼저 공격)
function resolveBattle(stats: PlayerStats, boss: boolean, random: RandomSource): TileResolution {
	const foe = boss ? TILE_CONFIG.BOSS : TILE_CONFIG.MONSTER;

	let foeHp: number = foe.HP;
	let current = stats;
	let won = false;
	// 레벨에 따른 공격력 보정
	const bonus = attackBonus(stats.level);

	// 공격력 최솟값이 1 이상이라 반드시 끝나지만, 설정 실수로 무한 반복하지 않게 상한을 둔다
	for (let round = 0; round < 200; round++) {
		foeHp -=
			randomInt(TILE_CONFIG.PLAYER_ATTACK.MIN, TILE_CONFIG.PLAYER_ATTACK.MAX, random) + bonus;
		if (foeHp <= 0) {
			won = true;
			break;
		}

		current = changeHp(current, -randomInt(foe.ATTACK_MIN, foe.ATTACK_MAX, random));
		if (isDefeated(current)) {
			break;
		}
	}

	const damageTaken = stats.hp - current.hp;
	const goldGained = won ? randomInt(foe.REWARD_MIN, foe.REWARD_MAX, random) : 0;
	const expGained = won ? (boss ? GROWTH_CONFIG.BOSS_EXP : GROWTH_CONFIG.MONSTER_EXP) : 0;
	// 승리했다면 체력이 남아 있으므로 레벨업 회복이 부활 처리와 겹치지 않는다
	const grown = gainExp(changeGold(current, goldGained), expGained);
	const defeat = applyDefeat(grown.stats);

	const outcome: BattleOutcome = {
		kind: 'BATTLE',
		boss,
		won,
		damageTaken,
		goldGained,
		expGained,
		levelsGained: grown.levelsGained,
		defeated: defeat.defeated,
		goldLost: defeat.goldLost
	};

	return { stats: defeat.stats, outcome, respawn: defeat.defeated };
}

// 영웅이 도착한 칸의 효과를 처리한다 (순수 함수: 원본 stats 는 바뀌지 않는다)
export function resolveTile(
	type: TileType,
	stats: PlayerStats,
	random: RandomSource = Math.random
): TileResolution {
	switch (type) {
		case 'EVENT':
			return resolveEvent(stats, random);
		case 'BATTLE':
			return resolveBattle(stats, false, random);
		case 'BOSS':
			return resolveBattle(stats, true, random);
		default:
			// START, CITY, JAIL 은 아직 효과가 없다
			return { stats, outcome: { kind: 'NONE' }, respawn: false };
	}
}
