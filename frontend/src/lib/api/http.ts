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

interface RequestOptions {
	timeoutMs?: number;
	fetcher?: typeof fetch;
}

export function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
	return apiRequest<T>('GET', path, undefined, options);
}

// JSON 본문을 보내는 요청 (POST·PUT)
export function apiSend<T>(
	method: 'POST' | 'PUT',
	path: string,
	body: unknown,
	options: RequestOptions = {}
): Promise<T> {
	return apiRequest<T>(method, path, body, options);
}

async function apiRequest<T>(
	method: string,
	path: string,
	body: unknown,
	options: RequestOptions
): Promise<T> {
	const base = getApiBaseUrl();
	if (base === null) throw new ApiError('VITE_API_BASE_URL 이 설정되지 않았습니다');

	const { timeoutMs = 5000, fetcher = fetch } = options;
	const headers: Record<string, string> = { Accept: 'application/json' };
	if (body !== undefined) headers['Content-Type'] = 'application/json';

	let response: Response;
	try {
		response = await fetcher(`${base}${path}`, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(timeoutMs)
		});
	} catch (cause) {
		throw new ApiError(`요청 실패: ${cause instanceof Error ? cause.message : String(cause)}`);
	}
	if (!response.ok) throw new ApiError(`서버 오류 (${response.status})`, response.status);
	return (await response.json()) as T;
}
