<!-- src/lib/i18n/LanguageSwitcher.svelte -->

<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localeState } from './locale.svelte';

	// 로케일 코드 -> 해당 언어의 표시 이름 (각 언어는 자기 이름으로 표기한다)
	const labels = { ko: () => m.ui_language_ko(), en: () => m.ui_language_en() } as const;
</script>

<div class="pointer-events-auto flex items-center gap-2 text-sm text-slate-100">
	<span>{m.ui_language()}</span>
	{#each localeState.all as code (code)}
		<button
			type="button"
			class="rounded px-2 py-1 {code === localeState.current
				? 'bg-slate-100 text-slate-900'
				: 'bg-slate-700'}"
			aria-pressed={code === localeState.current}
			onclick={() => localeState.set(code)}
		>
			{labels[code]()}
		</button>
	{/each}
</div>
