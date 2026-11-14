// src/lib/i18n/locale.svelte.ts

import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';

type Locale = (typeof locales)[number];

// paraglide 의 getLocale 은 반응형이 아니므로 $state 로 감싸 화면이 다시 그려지게 한다
let current = $state<Locale>(getLocale());

export const localeState = {
	get current(): Locale {
		return current;
	},
	get all(): readonly Locale[] {
		return locales;
	},
	// 페이지를 다시 불러오지 않고 전환해 게임 상태를 유지한다
	set(next: Locale): void {
		if (next === current) return;
		void setLocale(next, { reload: false });
		current = next;
		if (typeof document !== 'undefined') document.documentElement.lang = next;
	}
};
