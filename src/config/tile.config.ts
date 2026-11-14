// src/config/tile.config.ts

// 칸 효과 수치 (밸런스 조정은 이 파일만 고친다)
export const TILE_CONFIG = {
	// 출발 지점을 지나갈 때 받는 골드
	START_PASS_GOLD: 50,

	// 이벤트 칸: 아래 효과 중 하나를 같은 확률로 뽑고, 변화량은 MIN~MAX 사이 정수
	EVENT: {
		MIN: 10,
		MAX: 30,
		EFFECTS: ['GOLD_GAIN', 'GOLD_LOSS', 'HP_HEAL', 'HP_DAMAGE']
	},

	// 영웅의 자동 전투 공격력 (매 라운드 MIN~MAX 사이 정수)
	PLAYER_ATTACK: { MIN: 8, MAX: 14 },

	// 일반 몬스터 (전투 칸)
	MONSTER: {
		HP: 20,
		ATTACK_MIN: 5,
		ATTACK_MAX: 15,
		REWARD_MIN: 30,
		REWARD_MAX: 60
	},

	// 보스 (보스 칸)
	BOSS: {
		HP: 80,
		ATTACK_MIN: 10,
		ATTACK_MAX: 25,
		REWARD_MIN: 200,
		REWARD_MAX: 200
	},

	// 쓰러졌을 때(HP 0): 골드의 이 비율을 잃고 체력을 모두 회복해 출발 칸에서 부활한다
	DEFEAT_GOLD_LOSS_RATIO: 0.5
} as const;
