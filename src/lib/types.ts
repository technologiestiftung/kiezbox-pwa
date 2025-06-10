import { type CarbonIconProps } from 'carbon-icons-svelte';
import type { Component } from 'svelte';
import type { CallState } from './enums';
import type { RegistererState } from 'sip.js';
import { ApiStatus } from './enums';
import type { LngLatLike } from 'maplibre-gl';

export interface TabItem {
	title: string;
	slug: string;
	icon?: Component<CarbonIconProps>;
	content: InfoBoxItem[];
}

export interface Mode {
	status: number;
	isEmergency: boolean;
	coordinates: LngLatLike;
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

export interface NetworkServiceState {
	isCaptivePortal: boolean;
	errorMessage: string | null;
	lastPingTime: Date | null;
	apiStatus: ApiStatus;
	mode: Mode | null;
	coordinates: string[];
}

export interface CallServiceState {
	callState: CallState;
	registererState: RegistererState;
	errorMessage: string | null;
	callerId: string | null;
	isMicrophoneMuted: boolean;
	isSpeakerMuted: boolean;
	callDuration: number;
	remoteStream: MediaStream | null;
	localHTMLAudioElement: HTMLAudioElement | null;
}

export type State = 'idle' | 'pending' | 'success' | 'error';

export type SIPUser = {
	username: string;
	password: string;
	timestamp: number;
	displayName?: string;
};

export type SessionResponse = {
	extension: string | number;
	password: string;
	timestamp: number;
};
