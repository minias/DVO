// src/game/main.ts

import { CanvasRenderer } from './renderers/canvas.renderer';
import { World } from './world/world';
import { createHero } from './world/hero.factory';

const canvas = document.querySelector('canvas');
if (!canvas) throw new Error('Canvas not found');

const world = new World(createHero());

const renderer = new CanvasRenderer();
renderer.setWorld(world);

renderer.initialize(canvas);

function loop(time: number) {
	renderer.render(time);
	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);