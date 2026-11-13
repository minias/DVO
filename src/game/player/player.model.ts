// src/game/player/player.model.ts

// 플레이어 상태창에 표시되는 능력치
export interface PlayerStats {
	// 현재 체력 (0 ~ maxHp)
	hp: number;

	// 최대 체력
	maxHp: number;

	// 현재 마나 (0 ~ maxMp)
	mp: number;

	// 최대 마나
	maxMp: number;

	// 보유 골드 (0 이상)
	gold: number;
}
