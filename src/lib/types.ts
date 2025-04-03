import { type CarbonIconProps } from 'carbon-icons-svelte';
import type { Component } from 'svelte';

export interface TabItem {
	title: string;
	slug: string;
	icon?: Component<CarbonIconProps>;
	content: InfoBoxItem[];
}

export interface InfoBoxItem {
	title: string;
	textBodyOrList: string | string[];
	links: Link[];
}

export interface Link {
	href?: string;
	target?: string;
	text: string;
}
