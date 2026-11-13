// src/routes/page.svelte.test.ts
// 실제 Chromium 에서 페이지를 띄워 핵심 플레이 흐름(굴리기 → 이동 → 턴 종료)을 확인하는 스모크 테스트

import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '$lib/paraglide/messages';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('캔버스와 주사위 버튼이 표시되고 굴리기 버튼은 처음에 활성화되어 있다', async () => {
		const screen = await render(Page);

		expect(screen.container.querySelector('canvas')).not.toBeNull();

		const rollButton = page.getByRole('button', { name: m.action_roll_dice() });

		await expect.element(rollButton).toBeInTheDocument();
		await expect.element(rollButton).toBeEnabled();
	});

	it('주사위를 굴리면 이동 중에는 버튼이 비활성화되고, 이동이 끝나면 다시 활성화된다', async () => {
		await render(Page);

		const rollButton = page.getByRole('button', { name: m.action_roll_dice() });

		await rollButton.click();

		// 이동 연출 중: 안내 문구가 보이고 버튼은 잠긴다
		await expect.element(page.getByText(m.ui_moving())).toBeInTheDocument();
		await expect.element(rollButton).toBeDisabled();

		// 연출이 끝나면 다음 턴으로 넘어가 다시 굴릴 수 있다 (최대 12칸 × 한 칸 연출 시간 + 여유)
		await expect.element(rollButton, { timeout: 8000 }).toBeEnabled();
		await expect.element(page.getByText(m.ui_turn({ turn: 2 }))).toBeInTheDocument();
	});
});
