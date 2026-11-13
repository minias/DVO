// src/game/session/session.model.ts

// 턴 진행 단계
// - IDLE: 주사위를 굴릴 수 있는 상태
// - MOVING: 영웅이 이동 연출 중인 상태 (연출이 끝나기 전에는 굴릴 수 없음)
export type TurnPhase = 'IDLE' | 'MOVING';

// 한 번의 이동 계산 결과 (칸 번호는 1부터 시작하는 타일 id)
export interface MoveResult {
	// 출발 칸
	from: number;

	// 도착 칸
	to: number;

	// 이동한 칸 수 (주사위 합)
	steps: number;

	// 이동 중 출발 지점(1번 칸)을 지났는지 여부 (한 바퀴 완주, 향후 보상 처리용)
	passedStart: boolean;
}

// 게임 안에서 일어난 사건 (향후 이벤트 타일·전투 처리의 입력으로 사용)
export type GameEvent =
	| { type: 'ROLLED'; values: number[]; total: number }
	| { type: 'MOVED'; move: MoveResult };
