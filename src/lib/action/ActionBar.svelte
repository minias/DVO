<!-- src/lib/action/ActionBar.svelte -->

<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { GameSession } from '$game/session/game.svelte';

	let { session }: { session: GameSession } = $props();
</script>

<!-- 하단 액션 바: 주사위 굴리기 버튼. 터치하기 쉽도록 최소 높이 48px 이상 확보 -->
<div class="pointer-events-auto flex justify-center">
	<button
		type="button"
		class="min-h-12 w-full max-w-xs rounded-lg bg-amber-500 px-6 py-3 text-lg font-bold text-slate-900 shadow transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
		disabled={!session.canRoll}
		onclick={() => session.roll()}
	>
		{m.action_roll_dice()}
	</button>
</div>
