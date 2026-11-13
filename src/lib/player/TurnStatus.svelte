<!-- src/lib/player/TurnStatus.svelte -->

<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { GameSession } from '$game/session/game.svelte';

	let { session }: { session: GameSession } = $props();

	// 주사위 눈은 "2 + 5" 형태로 합쳐 표시한다
	const rollText = $derived(
		session.lastRoll
			? m.ui_last_roll({
					values: session.lastRoll.values.join(' + '),
					total: session.lastRoll.total
				})
			: m.ui_last_roll_none()
	);
</script>

<!-- 턴/주사위 결과 표시: 상태 변경을 스크린 리더에 공손하게 알린다 -->
<div class="flex flex-col items-center gap-1 text-center text-white" aria-live="polite">
	<p class="text-sm font-semibold opacity-80">{m.ui_turn({ turn: session.turn })}</p>
	<p class="text-base font-bold">{rollText}</p>
	{#if session.phase === 'MOVING'}
		<p class="text-sm text-amber-300">{m.ui_moving()}</p>
	{/if}
</div>
