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

// 주사위를 굴린 사건
export interface RolledEvent {
	type: 'ROLLED';

	// 각 주사위의 눈금
	values: number[];

	// 눈금의 합
	total: number;
}

// 이동이 끝난 사건
export interface MovedEvent {
	type: 'MOVED';

	move: MoveResult;
}

// 이벤트 칸에서 일어나는 효과 종류
export type EventEffect = 'GOLD_GAIN' | 'GOLD_LOSS' | 'HP_HEAL' | 'HP_DAMAGE';

// 칸에 도착해 일어난 일. defeated 는 HP 가 0 이 되어 부활 처리가 된 경우이다
export interface NoneOutcome {
	kind: 'NONE';
}

export interface EventOutcome {
	kind: 'EVENT';
	effect: EventEffect;
	// 실제로 바뀐 양(양수)
	amount: number;
	defeated: boolean;
	// 쓰러져서 잃은 골드
	goldLost: number;
}

export interface BattleOutcome {
	kind: 'BATTLE';
	boss: boolean;
	won: boolean;
	// 전투 중 잃은 HP 총량
	damageTaken: number;
	goldGained: number;
	// 전투 승리로 얻은 경험치와 오른 레벨 수
	expGained: number;
	levelsGained: number;
	defeated: boolean;
	goldLost: number;
	// 전투 중 스킬로 쓴 MP
	mpSpent: number;
}

// 도시 칸: 휴식(회복)과 무기 강화 결과
export interface CityOutcome {
	kind: 'CITY';
	// 휴식 비용으로 낸 골드 (0 이면 휴식하지 않음)
	restCost: number;
	// 골드가 부족해 휴식하지 못했는지 여부
	tooPoor: boolean;
	// 무기를 강화했으면 true
	weaponUpgraded: boolean;
	weaponCost: number;
}

// 감옥 칸: 벌금과 쉬게 될 턴 수
export interface JailOutcome {
	kind: 'JAIL';
	fine: number;
	skipTurns: number;
}

// 감옥에서 굴림을 쉬는 턴
export interface JailSkipOutcome {
	kind: 'JAIL_SKIP';
	// 앞으로 더 쉬어야 하는 턴 수
	remaining: number;
}

export type TileOutcome =
	NoneOutcome | EventOutcome | BattleOutcome | CityOutcome | JailOutcome | JailSkipOutcome;

// 칸 효과까지 처리된 사건 (startBonus 는 출발 지점 통과 보상)
export interface TileEvent {
	type: 'TILE';
	tileId: number;
	startBonus: number;
	outcome: TileOutcome;
}

// 게임 안에서 일어난 사건 (향후 이벤트 타일·전투 처리의 입력으로 사용)
// 유니온을 이름 있는 타입으로 나눠 prettier 버전과 상관없이 같은 서식이 나오게 한다
export type GameEvent = RolledEvent | MovedEvent | TileEvent;
