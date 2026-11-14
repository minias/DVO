// src/lib/api/inventory.api.ts

import { ApiError, apiGet, apiSend } from './http';
import type { SaveDto } from './save.api';

// backend/api/openapi.yaml 의 InventoryEntry·ItemResult 스키마와 같은 모양
export interface InventoryEntry {
	itemId: string;
	qty: number;
}

export interface ItemResult {
	save: SaveDto;
	inventory: InventoryEntry[];
}

// 응답 모양 검증: 어긋나면 화면 상태를 바꾸지 않도록 예외로 처리한다
function parseInventory(value: unknown): InventoryEntry[] {
	if (!Array.isArray(value)) throw new ApiError('인벤토리 응답이 올바르지 않습니다');
	return value.map((entry) => {
		const { itemId, qty } = (entry ?? {}) as Partial<InventoryEntry>;
		if (typeof itemId !== 'string' || !Number.isInteger(qty) || (qty as number) < 1)
			throw new ApiError('인벤토리 응답이 올바르지 않습니다');
		return { itemId, qty: qty as number };
	});
}

function parseResult(value: unknown): ItemResult {
	const data = (value ?? {}) as Partial<ItemResult>;
	if (typeof data.save !== 'object' || data.save === null)
		throw new ApiError('아이템 응답이 올바르지 않습니다');
	return { save: data.save, inventory: parseInventory(data.inventory) };
}

export async function fetchInventory(
	userId: number,
	fetcher?: typeof fetch
): Promise<InventoryEntry[]> {
	return parseInventory(await apiGet<unknown>(`/api/v1/users/${userId}/inventory`, { fetcher }));
}

// 구매: 골드 부족·보유 한도(409)면 ApiError(status 409)
export async function buyItem(
	userId: number,
	itemId: string,
	fetcher?: typeof fetch
): Promise<ItemResult> {
	return parseResult(
		await apiSend<unknown>('POST', `/api/v1/users/${userId}/inventory/buy`, { itemId }, { fetcher })
	);
}

// 사용: 보유하지 않으면(409) ApiError
export async function useItem(
	userId: number,
	itemId: string,
	fetcher?: typeof fetch
): Promise<ItemResult> {
	return parseResult(
		await apiSend<unknown>('POST', `/api/v1/users/${userId}/inventory/use`, { itemId }, { fetcher })
	);
}
