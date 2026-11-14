// src/lib/api/http.ts

// 백엔드 API 공용 클라이언트. 주소는 환경변수(VITE_API_BASE_URL)에서만 읽는다 (배포 환경별 전환용)

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message);
		this.name = 'ApiError';
	}
}

// 설정이 없으면 null: 백엔드 없이 프론트만 실행하는 상태이므로 호출하지 않는다
export function getApiBaseUrl(): string | null {
	const base = import.meta.env.VITE_API_BASE_URL;
	if (typeof base !== 'string' || base.trim() === '') return null;
	return base.trim().replace(/\/+$/, '');
}

export async function apiGet<T>(
	path: string,
	options: { timeoutMs?: number; fetcher?: typeof fetch } = {}
): Promise<T> {
	const base = getApiBaseUrl();
	if (base === null) throw new ApiError('VITE_API_BASE_URL 이 설정되지 않았습니다');

	const { timeoutMs = 5000, fetcher = fetch } = options;
	let response: Response;
	try {
		response = await fetcher(`${base}${path}`, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(timeoutMs)
		});
	} catch (cause) {
		throw new ApiError(`요청 실패: ${cause instanceof Error ? cause.message : String(cause)}`);
	}
	if (!response.ok) throw new ApiError(`서버 오류 (${response.status})`, response.status);
	return (await response.json()) as T;
}
