import type { Reroute } from '@sveltejs/kit/hooks';
//import { deLocalizeUrl } from '$lib/paraglide/runtime';

//export const reroute: Reroute = (request) => deLocalizeUrl(request.url).pathname;

export const reroute: Reroute = ({ url }) => {
	return url.pathname;
};
