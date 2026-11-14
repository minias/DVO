// src/lib/i18n/text.resolver.ts

import { m } from '$lib/paraglide/messages';
import type { TextResolver } from '$game/core/text.resolver';

// 키로 메시지 함수를 찾는다. 키가 없으면 키 문자열을 그대로 보여 누락을 눈에 띄게 한다
function lookup(key: string): string {
	const fn = (m as unknown as Record<string, (() => string) | undefined>)[key];
	return fn ? fn() : key;
}

// 호출 시점의 활성 로케일로 번역한다
export const textResolver: TextResolver = {
	tileName: (tile) => lookup(tile.nameKey),
	tileType: (type) => lookup(`board_type_${type.toLowerCase()}`)
};
