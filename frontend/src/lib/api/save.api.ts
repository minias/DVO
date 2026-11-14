// src/lib/api/save.api.ts

import { ApiError, apiGet, apiSend } from './http';

// backend/api/openapi.yaml 의 Save 스키마와 같은 모양 (position 은 0부터 시작하는 칸 번호)
export interface SaveDto {
	hp: number;
	maxHp: number;
	mp: number;
	maxMp: number;
	gold: number;
	level: number;
	exp: number;
	weapon: number;
	position: number;
}

// 개발용 임시 사용자 생성 (서버의 DVO_DEV_ENDPOINTS=1 일 때만 동작, 인증 도입 시 제거)
export async function createDevUser(name: string, fetcher?: typeof fetch): Promise<number> {
	const data = await apiSend<{ id: number }>('POST', '/api/v1/dev/users', { name }, { fetcher });
	if (!Number.isInteger(data?.id) || data.id < 1)
		throw new ApiError('사용자 응답이 올바르지 않습니다');
	return data.id;
}

// 세이브 조회: 저장된 게 없으면(404) null
export async function fetchSave(userId: number, fetcher?: typeof fetch): Promise<SaveDto | null> {
	try {
		return await apiGet<SaveDto>(`/api/v1/users/${userId}/save`, { fetcher });
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) return null;
		throw error;
	}
}

export async function putSave(
	userId: number,
	save: SaveDto,
	fetcher?: typeof fetch
): Promise<void> {
	await apiSend('PUT', `/api/v1/users/${userId}/save`, save, { fetcher });
}
