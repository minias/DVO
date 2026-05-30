// src/game/world/hero.factory.ts
// hero.factory.ts

import type { HeroEntity } from '../entities/hero.entity';

export const createHero = (): HeroEntity => {
	return {
		id: 'hero-1',
		name: 'Hero',

		x: 1,
		y: 0,

		w: 1,
		h: 1,

		vx: 0,
		vy: 0
	};
};