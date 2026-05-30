// src/game/world/world.ts
// world.ts

import type { HeroEntity } from '../entities/hero.entity';

export class World {
	private hero: HeroEntity;

	constructor(hero: HeroEntity) {
		this.hero = hero;
	}

	getHero(): HeroEntity {
		return this.hero;
	}

	setHero(hero: HeroEntity): void {
		this.hero = hero;
	}

	moveHeroByPosition(position: number, tilesLength: number): void {
		this.hero.x = position;

		if (this.hero.x > tilesLength) {
			this.hero.x = 1;
		}
	}
}