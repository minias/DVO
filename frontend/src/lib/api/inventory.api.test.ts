// src/lib/api/inventory.api.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buyItem, fetchInventory, useItem } from './inventory.api';

const SAVE = {
	hp: 80,
	maxHp: 100,
	mp: 10,
	maxMp: 20,
	gold: 120,
	level: 2,
	exp: 5,
	weapon: 1,
	position: 3
};

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status });
}

describe('inventory.api', () => {
	beforeEach(() => vi.stubEnv('VITE_API_BASE_URL', 'http://api.test'));
	afterEach(() => vi.unstubAllEnvs());

	it('인벤토리를 조회한다', async () => {
		const fetcher = vi.fn(async () => json([{ itemId: 'potion_hp', qty: 2 }]));
		const result = await fetchInventory(1, fetcher as unknown as typeof fetch);
		expect(result).toEqual([{ itemId: 'potion_hp', qty: 2 }]);
	});

	it('모양이 어긋난 인벤토리 응답은 거부한다', async () => {
		const fetcher = vi.fn(async () => json([{ itemId: 'potion_hp', qty: 0 }]));
		await expect(fetchInventory(1, fetcher as unknown as typeof fetch)).rejects.toThrow();
	});

	it('구매 요청은 itemId 를 POST 하고 세이브·인벤토리를 돌려준다', async () => {
		const fetcher = vi.fn(async () =>
			json({ save: SAVE, inventory: [{ itemId: 'elixir', qty: 1 }] })
		);
		const result = await buyItem(1, 'elixir', fetcher as unknown as typeof fetch);
		expect(result.save.gold).toBe(120);
		expect(fetcher).toHaveBeenCalledWith(
			'http://api.test/api/v1/users/1/inventory/buy',
			expect.objectContaining({ method: 'POST', body: JSON.stringify({ itemId: 'elixir' }) })
		);
	});

	it('골드 부족(409)은 상태 코드를 담은 오류로 실패한다', async () => {
		const fetcher = vi.fn(async () => json({ error: 'not_enough_gold' }, 409));
		await expect(useItem(1, 'potion_hp', fetcher as unknown as typeof fetch)).rejects.toMatchObject(
			{
				status: 409
			}
		);
	});
});
