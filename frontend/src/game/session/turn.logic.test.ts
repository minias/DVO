// src/game/session/turn.logic.test.ts

import { describe, expect, it } from 'vitest';
import { calculateMove } from './turn.logic';

describe('calculateMove', () => {
	it('보드 안에서는 단순히 칸 수만큼 앞으로 이동한다', () => {
		expect(calculateMove(1, 5, 36)).toEqual({ from: 1, to: 6, steps: 5, passedStart: false });
	});

	it('마지막 칸에 정확히 도착하면 한 바퀴를 돈 것이 아니다', () => {
		const move = calculateMove(30, 6, 36);

		expect(move.to).toBe(36);
		expect(move.passedStart).toBe(false);
	});

	it('마지막 칸을 넘으면 1번 칸부터 다시 시작하고 출발 지점을 지난 것으로 본다', () => {
		const move = calculateMove(35, 4, 36);

		expect(move.to).toBe(3);
		expect(move.passedStart).toBe(true);
	});

	it('0칸 이동은 제자리이다', () => {
		expect(calculateMove(10, 0, 36)).toEqual({ from: 10, to: 10, steps: 0, passedStart: false });
	});

	it('잘못된 입력은 에러를 던진다', () => {
		expect(() => calculateMove(0, 3, 36)).toThrow();
		expect(() => calculateMove(37, 3, 36)).toThrow();
		expect(() => calculateMove(1, -1, 36)).toThrow();
		expect(() => calculateMove(1, 1.5, 36)).toThrow();
		expect(() => calculateMove(1, 3, 0)).toThrow();
	});
});
