<!-- src/lib/game/GameCanvas.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';

	import { CanvasRenderer } from '$game/renderers/canvas.renderer';

	let canvas: HTMLCanvasElement;

	let frameId = 0;

	const renderer = new CanvasRenderer();

	function gameLoop(): void {
		renderer.render(0);

		frameId = requestAnimationFrame(gameLoop);
	}
	function resizeCanvas(): void {
		renderer.resize(
			window.innerWidth,
			window.innerHeight
		);
	}
	onMount(() => {
		renderer.initialize(canvas);

		resizeCanvas();

		window.addEventListener(
			'resize',
			resizeCanvas
		);

		gameLoop();

		return () => {
			window.removeEventListener(
				'resize',
				resizeCanvas
			);

			cancelAnimationFrame(frameId);

			renderer.destroy();
		};
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		display: block;
		width: 100vw;
		height: 100vh;
		border: 1px solid #374151;
	}
</style>