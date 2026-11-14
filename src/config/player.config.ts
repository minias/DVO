// src/config/player.config.ts

export const PLAYER_CONFIG = {
	// 최대 체력
	MAX_HP: 100,

	// 최대 마나
	MAX_MP: 50,

	// 시작 체력
	INITIAL_HP: 100,

	// 시작 마나
	INITIAL_MP: 50,

	// 시작 골드
	INITIAL_GOLD: 0
} as const;

// 성장 규칙 (밸런스 조정은 이 파일만 고친다)
export const GROWTH_CONFIG = {
	// 시작 레벨과 최대 레벨
	INITIAL_LEVEL: 1,
	MAX_LEVEL: 10,

	// 다음 레벨까지 필요한 경험치 = 현재 레벨 × 이 값
	EXP_PER_LEVEL: 50,

	// 레벨업 한 번당 오르는 능력치
	MAX_HP_PER_LEVEL: 20,
	MAX_MP_PER_LEVEL: 5,
	ATTACK_PER_LEVEL: 2,

	// 전투 승리 경험치 (일반 몬스터, 보스)
	MONSTER_EXP: 20,
	BOSS_EXP: 100
} as const;
