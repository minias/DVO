// src/game/session/turn.logic.ts

import type { MoveResult } from './session.model';

// 현재 칸에서 steps 만큼 이동한 결과를 계산한다.
// 보드는 원형이라 마지막 칸 다음은 1번 칸이다.
export function calculateMove(position: number, steps: number, tileCount: number): MoveResult {
	if (!Number.isInteger(tileCount) || tileCount < 1) {
		throw new Error(`Invalid tile count: ${tileCount}`);
	}

	if (!Number.isInteger(position) || position < 1 || position > tileCount) {
		throw new Error(`Invalid position: ${position} (1~${tileCount})`);
	}

	if (!Number.isInteger(steps) || steps < 0) {
		throw new Error(`Invalid steps: ${steps}`);
	}

	// 0 기반 인덱스로 계산한 뒤 다시 1 기반 칸 번호로 되돌린다
	const rawIndex = position - 1 + steps;
	const to = (rawIndex % tileCount) + 1;

	// 인덱스가 칸 수 이상이면 1번 칸을 한 번 이상 지난 것이다
	const passedStart = rawIndex >= tileCount;

	return { from: position, to, steps, passedStart };
}
