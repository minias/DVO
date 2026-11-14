import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-auto';

export default defineConfig({
	plugins: [
		tailwindcss(),
		// kit 3 부터 svelte.config.js 를 쓰지 않고 이 플러그인 옵션으로 설정한다
		sveltekit({
			compilerOptions: {
				// 라이브러리(node_modules)를 제외하고 프로젝트 전체를 runes 모드로 강제한다. Svelte 6 에서는 제거 가능
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// kit 3 은 $lib 를 기본 제공하지 않으므로 직접 등록한다. alias 는 deprecated 이므로 추후 subpath imports(#...)로 이전한다
			alias: {
				$lib: 'src/lib',
				$game: 'src/game',
				$config: 'src/config'
			},
			// adapter-auto 는 일부 환경만 지원한다. 배포 환경이 정해지면 해당 어댑터로 바꾼다
			adapter: adapter()
		}),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' })
	],
	test: {
		// 아직 브라우저(client) 테스트가 없는 상태에서도 게이트가 통과하도록 한다
		passWithNoTests: true,
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
