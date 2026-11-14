// src/game/core/text.resolver.ts

import type { BoardTile, TileType } from '../board/board.model';

// 게임 로직이 화면 문구를 직접 알지 않도록 번역을 주입받는 계약.
// 구현은 UI 계층(src/lib/i18n)에서 제공하고, 렌더러는 그릴 때마다 호출해 언어 전환을 즉시 반영한다
export interface TextResolver {
	tileName(tile: BoardTile): string;
	tileType(type: TileType): string;
}
