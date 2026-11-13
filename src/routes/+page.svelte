<!-- src/routes/+page.svelte -->

<script lang="ts">
	import { createGameSession } from '$game/session/game.svelte';
	import GameCanvas from '$lib/game/GameCanvas.svelte';
	import ActionBar from '$lib/action/ActionBar.svelte';
	import TurnStatus from '$lib/player/TurnStatus.svelte';

	const session = createGameSession();
</script>

<GameCanvas {session} />

<!-- 캔버스 위 하단 고정 UI: 컨테이너는 입력을 통과시키고, 버튼만 pointer-events-auto -->
<div
	class="pointer-events-none fixed inset-x-0 bottom-0 flex flex-col gap-3 bg-slate-900/70 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
>
	<TurnStatus {session} />
	<ActionBar {session} />
</div>
