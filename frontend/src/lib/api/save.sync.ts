// src/lib/api/save.sync.ts

import type { GameSession } from '$game/session/game.svelte';
import { getApiBaseUrl } from './http';
import { createDevUser, fetchSave, putSave } from './save.api';

const USER_KEY = 'dvo.devUserId';

// 브라우저 저장소가 막힌 환경(사생활 보호 모드 등)에서도 게임은 동작해야 한다
function readUserId(): number | null {
	try {
		const raw = localStorage.getItem(USER_KEY);
		const id = raw === null ? NaN : Number(raw);
		return Number.isInteger(id) && id >= 1 ? id : null;
	} catch {
		return null;
	}
}

function writeUserId(id: number): void {
	try {
		localStorage.setItem(USER_KEY, String(id));
	} catch {
		// 저장 실패는 무시: 다음 방문에 새 임시 사용자가 만들어질 뿐이다
	}
}

// 서버 세이브 연동 핸들. 서버가 없으면 null 이며, 이 경우 게임은 기존 동작 그대로다
export interface SaveSync {
	// 저장 가능한 상태가 되면(턴이 끝난 뒤 등) 호출한다. 실패해도 게임을 멈추지 않는다
	save(): void;
}

// 임시 사용자를 확보하고 세이브를 복원한다. 어느 단계든 실패하면 null (오프라인 폴백)
export async function startSaveSync(session: GameSession): Promise<SaveSync | null> {
	if (getApiBaseUrl() === null) return null;

	try {
		let userId = readUserId();
		if (userId === null) {
			userId = await createDevUser('player');
			writeUserId(userId);
		}

		const saved = await fetchSave(userId);
		if (saved !== null) session.restore(saved);

		const id = userId;
		let inFlight = false;
		let dirty = false;
		// 저장이 겹치면 마지막 상태만 한 번 더 보낸다
		const flush = async (): Promise<void> => {
			if (inFlight) {
				dirty = true;
				return;
			}
			inFlight = true;
			try {
				await putSave(id, session.snapshot());
			} catch {
				// 네트워크 오류는 다음 턴 저장에서 만회된다
			} finally {
				inFlight = false;
				if (dirty) {
					dirty = false;
					void flush();
				}
			}
		};
		return { save: () => void flush() };
	} catch {
		return null;
	}
}
