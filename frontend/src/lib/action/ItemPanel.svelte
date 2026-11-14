<!-- src/lib/action/ItemPanel.svelte -->

<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { ITEM_IDS, ITEM_PRICES, MAX_ITEM_QTY, type ItemId } from '$config/item.config';
	import type { GameSession } from '$game/session/game.svelte';
	import type { SaveSync } from '$lib/api/save.sync';

	let { session, sync }: { session: GameSession; sync: SaveSync } = $props();

	// 요청이 진행되는 동안 같은 버튼의 중복 클릭을 막는다
	let busy = $state(false);

	// 번역 키는 정적 함수 호출로만 쓸 수 있어 아이템 id 별로 매핑한다
	const NAMES: Record<ItemId, () => string> = {
		potion_hp: () => m.item_potion_hp(),
		potion_mp: () => m.item_potion_mp(),
		elixir: () => m.item_elixir()
	};

	function qtyOf(id: ItemId): number {
		return session.inventory.find((e) => e.itemId === id)?.qty ?? 0;
	}

	async function run(action: (id: string) => Promise<boolean>, id: ItemId): Promise<void> {
		if (busy) return;
		busy = true;
		try {
			await action(id);
		} finally {
			busy = false;
		}
	}
</script>

<!-- 아이템 패널: 이동 대기 중에는 사용, 도시 칸에서는 구매. 서버가 있을 때만 표시된다 -->
<section
	class="pointer-events-auto flex flex-wrap items-center justify-center gap-2 text-sm text-white"
	aria-label={m.ui_inventory()}
>
	{#each ITEM_IDS as id (id)}
		{@const qty = qtyOf(id)}
		<div class="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2">
			<span>{NAMES[id]()} ×{qty}</span>
			<button
				type="button"
				class="min-h-9 rounded bg-emerald-500 px-3 font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
				disabled={busy || !session.canRoll || qty < 1}
				onclick={() => run(sync.use, id)}
			>
				{m.action_use_item()}
			</button>
			{#if session.canShop}
				<button
					type="button"
					class="min-h-9 rounded bg-amber-500 px-3 font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
					disabled={busy || qty >= MAX_ITEM_QTY || session.stats.gold < ITEM_PRICES[id]}
					onclick={() => run(sync.buy, id)}
				>
					{m.action_buy_item({ price: ITEM_PRICES[id] })}
				</button>
			{/if}
		</div>
	{/each}
</section>
