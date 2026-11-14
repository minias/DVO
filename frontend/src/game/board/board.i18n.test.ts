// src/game/board/board.i18n.test.ts
// 보드가 참조하는 번역 키가 모든 언어 파일에 존재하는지 확인한다 (키 누락 방지)

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOARD_TILE_DEFINITIONS } from './board.data';

const LOCALES = ['ko', 'en'];
const TILE_TYPES = ['start', 'city', 'event', 'battle', 'boss', 'jail'];

describe('보드 번역 키', () => {
	for (const locale of LOCALES) {
		const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf-8')) as Record<
			string,
			string
		>;

		it(`${locale}: 모든 타일 이름 키가 존재하고 비어 있지 않다`, () => {
			for (const def of BOARD_TILE_DEFINITIONS) {
				expect(messages[def.nameKey], def.nameKey).toBeTruthy();
			}
		});

		it(`${locale}: 모든 타일 종류 키가 존재한다`, () => {
			for (const type of TILE_TYPES) {
				expect(messages[`board_type_${type}`], type).toBeTruthy();
			}
		});
	}
});
