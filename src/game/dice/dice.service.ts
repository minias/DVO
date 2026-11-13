// src/game/dice/dice.service.ts

import { DICE_CONFIG } from '$config/dice.config';
import type { DiceResult, DiceRollOptions, RandomSource } from './dice.model';

// 주사위를 굴려 눈금 목록과 합계를 반환한다.
// 개수와 눈금 범위는 DICE_CONFIG 에서 읽고, 옵션으로 덮어쓸 수 있다.
export function rollDice(
	options: DiceRollOptions = {},
	random: RandomSource = Math.random
): DiceResult {
	const count = options.count ?? DICE_CONFIG.DEFAULT_COUNT;
	const min = options.min ?? DICE_CONFIG.MIN;
	const max = options.max ?? DICE_CONFIG.MAX;

	// 잘못된 설정은 조용히 넘기지 않고 즉시 실패시킨다
	if (!Number.isInteger(count) || count < 1) {
		throw new Error(`Invalid dice count: ${count}`);
	}

	if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
		throw new Error(`Invalid dice range: ${min}~${max}`);
	}

	const sides = max - min + 1;
	const values: number[] = [];

	for (let i = 0; i < count; i++) {
		// random() 이 1 미만이므로 결과는 항상 min~max 범위 안이다
		values.push(min + Math.floor(random() * sides));
	}

	const total = values.reduce((sum, value) => sum + value, 0);

	return { values, total };
}
