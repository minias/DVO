<!-- src/lib/player/StatusBar.svelte -->

<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { GROWTH_CONFIG } from '$config/player.config';
	import { expToNext } from '$game/player/player.logic';
	import type { GameSession } from '$game/session/game.svelte';

	let { session }: { session: GameSession } = $props();

	// HP 비율이 이 값 이하이면 위험 색상으로 표시한다 (30%)
	const LOW_HP_RATIO = 0.3;

	// 비율을 0~100% 로 제한한다. max 가 0 이하이면 NaN 방지를 위해 0 으로 처리한다
	function toPercent(current: number, max: number): number {
		if (max <= 0) return 0;
		return Math.min(100, Math.max(0, (current / max) * 100));
	}

	const hpPercent = $derived(toPercent(session.stats.hp, session.stats.maxHp));
	const mpPercent = $derived(toPercent(session.stats.mp, session.stats.maxMp));
	const isLowHp = $derived(hpPercent <= LOW_HP_RATIO * 100);

	const levelLabel = $derived(
		session.stats.level >= GROWTH_CONFIG.MAX_LEVEL
			? m.ui_level_max({ level: session.stats.level })
			: m.ui_level({
					level: session.stats.level,
					exp: session.stats.exp,
					next: expToNext(session.stats.level)
				})
	);
	const hpLabel = $derived(m.ui_hp({ current: session.stats.hp, max: session.stats.maxHp }));
	const mpLabel = $derived(m.ui_mp({ current: session.stats.mp, max: session.stats.maxMp }));
</script>

<!-- 플레이어 상태창: HP/MP 막대와 골드. 좁은 화면에서는 줄바꿈된다 -->
<section
	class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white"
	aria-label={m.ui_status()}
>
	<p class="font-semibold text-violet-300">{levelLabel}</p>

	<div class="flex min-w-32 flex-1 flex-col gap-1">
		<span class="font-semibold">{hpLabel}</span>
		<div
			class="h-2 overflow-hidden rounded-full bg-white/20"
			role="progressbar"
			aria-label={hpLabel}
			aria-valuenow={session.stats.hp}
			aria-valuemin={0}
			aria-valuemax={session.stats.maxHp}
		>
			<div
				class="h-full transition-all {isLowHp ? 'bg-red-500' : 'bg-emerald-400'}"
				style:width="{hpPercent}%"
			></div>
		</div>
	</div>

	<div class="flex min-w-32 flex-1 flex-col gap-1">
		<span class="font-semibold">{mpLabel}</span>
		<div
			class="h-2 overflow-hidden rounded-full bg-white/20"
			role="progressbar"
			aria-label={mpLabel}
			aria-valuenow={session.stats.mp}
			aria-valuemin={0}
			aria-valuemax={session.stats.maxMp}
		>
			<div class="h-full bg-sky-400 transition-all" style:width="{mpPercent}%"></div>
		</div>
	</div>

	<!-- 무기 강화 단계 -->
	<p class="font-semibold text-orange-300">{m.ui_weapon({ tier: session.stats.weapon })}</p>

	<p class="font-semibold text-amber-300">{m.ui_gold({ amount: session.stats.gold })}</p>
</section>
