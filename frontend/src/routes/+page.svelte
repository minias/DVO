<!-- src/routes/+page.svelte -->

<script lang="ts">
	import { createGameSession } from '$game/session/game.svelte';
	import GameCanvas from '$lib/game/GameCanvas.svelte';
	import ActionBar from '$lib/action/ActionBar.svelte';
	import TurnStatus from '$lib/player/TurnStatus.svelte';
	import LanguageSwitcher from '$lib/i18n/LanguageSwitcher.svelte';
	import { localeState } from '$lib/i18n/locale.svelte';
	import StatusBar from '$lib/player/StatusBar.svelte';

	import { onMount } from 'svelte';
	import { startSaveSync, type SaveSync } from '$lib/api/save.sync';

	const session = createGameSession();

	// 서버가 있으면 세이브를 복원하고, 턴이 끝날 때마다 저장한다 (서버가 없으면 아무 일도 하지 않음)
	let sync: SaveSync | null = null;
	onMount(() => {
		void startSaveSync(session).then((s) => (sync = s));
	});

	// 턴 번호가 바뀌면(이동·칸 효과 확정, 감옥 턴 넘김) 저장한다
	$effect(() => {
		void session.turn;
		if (session.phase === 'IDLE') sync?.save();
	});
</script>

<GameCanvas {session} />

<!-- 캔버스 위 하단 고정 UI: 컨테이너는 입력을 통과시키고, 버튼만 pointer-events-auto -->
<div
	class="pointer-events-none fixed inset-x-0 bottom-0 flex flex-col gap-3 bg-slate-900/70 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
>
	<!-- 세션은 key 밖에서 만들어 언어를 바꿔도 게임 상태가 유지된다 -->
	{#key localeState.current}
		<LanguageSwitcher />
		<TurnStatus {session} />
		<StatusBar {session} />
		<ActionBar {session} />
	{/key}
</div>
