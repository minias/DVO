// src/lib/api/config.api.ts

import { apiGet } from './http';

// backend/api/openapi.yaml 의 GameConfig 스키마와 같은 모양
export interface GameConfigDto {
	tiles: { id: number; type: string; nameKey: string }[];
	foes: {
		id: string;
		hp: number;
		attackMin: number;
		attackMax: number;
		rewardMin: number;
		rewardMax: number;
		exp: number;
	}[];
	rules: Record<string, number>;
	items: { id: string; kind: string; nameKey: string; price: number; effect?: unknown }[];
}

// 앱 시작 시 1회 호출한다. 서버가 없거나 실패하면 null 을 돌려주며,
// 이때 게임은 기존 로컬 설정(src/config/*, board.data.ts)을 그대로 사용한다
export async function loadGameConfig(fetcher?: typeof fetch): Promise<GameConfigDto | null> {
	try {
		const data = await apiGet<GameConfigDto>('/api/v1/config', { fetcher });
		// 최소 모양 검증: 어긋나면 서버 값을 쓰지 않고 로컬 기본값으로 폴백
		if (!Array.isArray(data?.tiles) || !Array.isArray(data?.foes)) return null;
		return data;
	} catch {
		return null;
	}
}
