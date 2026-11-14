// src/lib/api/config.api.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadGameConfig } from './config.api';

const sample = { tiles: [], foes: [], rules: {}, items: [] };
const okFetch = (body: unknown, ok = true) =>
	vi.fn(
		async (_input: RequestInfo | URL) =>
			({ ok, status: ok ? 200 : 500, json: async () => body }) as Response
	);

describe('loadGameConfig', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('API 주소가 없으면 호출하지 않고 null 을 돌려준다', async () => {
		vi.stubEnv('VITE_API_BASE_URL', '');
		const fetcher = okFetch(sample);
		expect(await loadGameConfig(fetcher)).toBeNull();
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('성공하면 서버 설정을 돌려준다 (끝의 슬래시는 정리)', async () => {
		vi.stubEnv('VITE_API_BASE_URL', 'http://api.example/');
		const fetcher = okFetch(sample);
		expect(await loadGameConfig(fetcher)).toEqual(sample);
		expect(fetcher.mock.calls[0][0]).toBe('http://api.example/api/v1/config');
	});

	it('서버 오류나 잘못된 모양이면 null 로 폴백한다', async () => {
		vi.stubEnv('VITE_API_BASE_URL', 'http://api.example');
		expect(await loadGameConfig(okFetch({}, false))).toBeNull();
		expect(await loadGameConfig(okFetch({ tiles: 1 }))).toBeNull();
		expect(await loadGameConfig(vi.fn(async () => Promise.reject(new Error('net'))))).toBeNull();
	});
});
