// src/game/dice/dice.model.ts

// 주사위 굴림 옵션 (생략 시 DICE_CONFIG 기본값 사용)
export interface DiceRollOptions {
	// 굴릴 주사위 개수
	count?: number;

	// 눈금 최솟값
	min?: number;

	// 눈금 최댓값
	max?: number;
}

// 0 이상 1 미만의 난수를 반환하는 함수 (테스트에서 고정값 주입용)
export type RandomSource = () => number;

// 주사위 굴림 결과
export interface DiceResult {
	// 각 주사위의 눈금
	values: number[];

	// 눈금의 합 (이동 칸 수로 사용)
	total: number;
}
