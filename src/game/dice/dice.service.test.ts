// src/game/dice/dice.service.test.ts

import { describe, expect, it } from 'vitest';
import { DICE_CONFIG } from '$config/dice.config';
import { rollDice } from './dice.service';

// 준비된 값을 순서대로 반환하는 난수 함수
function sequence(...numbers: number[]) {
	let index = 0;
	return () => numbers[index++ % numbers.length];
}

describe('rollDice', () => {
	it('설정 기본값(개수 2, 눈금 1~6)으로 굴린다', () => {
		const result = rollDice();

		expect(result.values).toHaveLength(DICE_CONFIG.DEFAULT_COUNT);
		for (const value of result.values) {
			expect(value).toBeGreaterThanOrEqual(DICE_CONFIG.MIN);
			expect(value).toBeLessThanOrEqual(DICE_CONFIG.MAX);
		}
	});

	it('합계는 각 눈금의 합과 같다', () => {
		// 0 → 1, 0.99 → 6
		const result = rollDice({}, sequence(0, 0.99));

		expect(result.values).toEqual([1, 6]);
		expect(result.total).toBe(7);
	});

	it('난수 경계값에서도 범위를 벗어나지 않는다', () => {
		const lowest = rollDice({ count: 1 }, () => 0);
		const highest = rollDice({ count: 1 }, () => 0.9999999);

		expect(lowest.total).toBe(DICE_CONFIG.MIN);
		expect(highest.total).toBe(DICE_CONFIG.MAX);
	});

	it('옵션으로 개수와 범위를 바꿀 수 있다 (코드 수정 없이 설정만 변경)', () => {
		const result = rollDice({ count: 4, min: 1, max: 6 }, sequence(0.5));

		expect(result.values).toHaveLength(4);
		expect(result.values.every((v) => v === 4)).toBe(true);
		expect(result.total).toBe(16);
	});

	it('1000번 굴려도 항상 유효한 범위 안이다', () => {
		for (let i = 0; i < 1000; i++) {
			const { values, total } = rollDice();
			expect(values.every((v) => v >= 1 && v <= 6)).toBe(true);
			expect(total).toBeGreaterThanOrEqual(2);
			expect(total).toBeLessThanOrEqual(12);
		}
	});

	it('잘못된 개수나 범위는 에러를 던진다', () => {
		expect(() => rollDice({ count: 0 })).toThrow();
		expect(() => rollDice({ count: 1.5 })).toThrow();
		expect(() => rollDice({ min: 6, max: 1 })).toThrow();
	});
});
