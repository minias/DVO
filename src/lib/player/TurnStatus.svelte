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

	// 마지막 칸 효과를 화면에 보여줄 문구 목록으로 바꾼다
	const outcomeLines = $derived.by((): string[] => {
		const tile = session.lastTile;
		if (!tile) return [];

		const lines: string[] = [];
		if (tile.startBonus > 0) lines.push(m.ui_outcome_start_bonus({ amount: tile.startBonus }));

		const o = tile.outcome;
		if (o.kind === 'EVENT') {
			const amount = o.amount;
			const byEffect = {
				GOLD_GAIN: () => m.ui_outcome_event_gold_gain({ amount }),
				GOLD_LOSS: () => m.ui_outcome_event_gold_loss({ amount }),
				HP_HEAL: () => m.ui_outcome_event_hp_heal({ amount }),
				HP_DAMAGE: () => m.ui_outcome_event_hp_damage({ amount })
			};
			lines.push(byEffect[o.effect]());
		} else if (o.kind === 'BATTLE') {
			const params = { gold: o.goldGained, damage: o.damageTaken };
			if (o.boss) {
				lines.push(o.won ? m.ui_outcome_boss_win(params) : m.ui_outcome_boss_lose(params));
			} else {
				lines.push(o.won ? m.ui_outcome_battle_win(params) : m.ui_outcome_battle_lose(params));
			}
		}
		if (o.kind === 'BATTLE' && o.expGained > 0) {
			lines.push(m.ui_outcome_exp({ amount: o.expGained }));
			if (o.levelsGained > 0) lines.push(m.ui_outcome_level_up({ level: session.stats.level }));
		}
		if (o.kind !== 'NONE' && o.defeated) lines.push(m.ui_outcome_defeated({ gold: o.goldLost }));

		return lines;
	});
</script>

<!-- 턴/주사위 결과 표시: 상태 변경을 스크린 리더에 공손하게 알린다 -->
<div class="flex flex-col items-center gap-1 text-center text-white" aria-live="polite">
	<p class="text-sm font-semibold opacity-80">{m.ui_turn({ turn: session.turn })}</p>
	<p class="text-base font-bold">{rollText}</p>
	{#each outcomeLines as line (line)}
		<p class="text-sm text-emerald-300">{line}</p>
	{/each}
	{#if session.phase === 'MOVING'}
		<p class="text-sm text-amber-300">{m.ui_moving()}</p>
	{/if}
</div>
