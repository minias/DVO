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

	// 도시 칸: 골드를 내고 HP·MP 를 모두 회복하고, 남은 골드로 무기를 한 단계 강화한다
	CITY: {
		REST_COST: 20,
		// 무기 강화 비용 = (현재 무기 단계 + 1) × 이 값
		WEAPON_COST_PER_TIER: 100
	},

	// 감옥 칸: 벌금(가진 골드까지만)을 내고 다음 굴림을 쉰다
	JAIL: { FINE: 30, SKIP_TURNS: 1 },

	// MP 스킬(강타): 전투 라운드마다 MP 가 충분하면 소모하고 공격력이 늘어난다
	SKILL: { MP_COST: 10, BONUS_ATTACK: 10 },

	// 쓰러졌을 때(HP 0): 골드의 이 비율을 잃고 체력을 모두 회복해 출발 칸에서 부활한다
	DEFEAT_GOLD_LOSS_RATIO: 0.5
} as const;
