// src/lib/api/save.api.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDevUser, fetchSave, putSave, type SaveDto } from './save.api';

const SAVE: SaveDto = {
	hp: 80,
	maxHp: 100,
	mp: 10,
	maxMp: 20,
	gold: 150,
	level: 2,
	exp: 5,
	weapon: 1,
	position: 3
};

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status });
}

describe('save.api', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('서버 주소가 없으면 요청하지 않고 실패한다', async () => {
		vi.stubEnv('VITE_API_BASE_URL', '');
		const fetcher = vi.fn();
		await expect(fetchSave(1, fetcher as unknown as typeof fetch)).rejects.toThrow();
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('임시 사용자를 만들고 id 를 돌려준다', async () => {
		vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
		const fetcher = vi.fn().mockResolvedValue(json({ id: 7, name: 'player' }, 201));
		await expect(createDevUser('player', fetcher)).resolves.toBe(7);
		const [url, init] = fetcher.mock.calls[0];
		expect(url).toBe('http://api.test/api/v1/dev/users');
		expect(init.method).toBe('POST');
		expect(init.body).toBe(JSON.stringify({ name: 'player' }));
	});

	it('세이브가 없으면(404) null 을 돌려준다', async () => {
		vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
		const fetcher = vi.fn().mockResolvedValue(json({ error: 'not_found' }, 404));
		await expect(fetchSave(1, fetcher)).resolves.toBeNull();
	});

	it('404 가 아닌 오류는 그대로 던진다', async () => {
		vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
		const fetcher = vi.fn().mockResolvedValue(json({ error: 'x' }, 500));
		await expect(fetchSave(1, fetcher)).rejects.toThrow();
	});

	it('세이브를 PUT 으로 저장한다', async () => {
		vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
		const fetcher = vi.fn().mockResolvedValue(json({ ...SAVE, updatedAt: 'now' }));
		await putSave(1, SAVE, fetcher);
		const [url, init] = fetcher.mock.calls[0];
		expect(url).toBe('http://api.test/api/v1/users/1/save');
		expect(init.method).toBe('PUT');
		expect(JSON.parse(init.body)).toEqual(SAVE);
	});
});
