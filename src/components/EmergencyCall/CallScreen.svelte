<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { t } from '$lib/translations';
	import { Microphone, MicrophoneOff, VolumeMute, VolumeUp } from 'carbon-icons-svelte';
	import EmergencyCallButton from './EmergencyCallButton.svelte';

	let {
		isInCall,
		canCall,
		isEmergency,
		isMicrophoneMuted,
		isSpeakerMuted,
		activateMic,
		activateSpeaker,
		activateCall,
		buttonText,
		errorMessage,
		time,
		remoteAudio = $bindable()
	} = $props();

	const formatMilliseconds = (ms: number): string => {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
		const seconds = String(totalSeconds % 60).padStart(2, '0');
		return `${minutes}:${seconds}`;
	};
</script>

<div
	class="CallScreen-root sticky bottom-0 z-10 flex w-full flex-col items-center justify-center bg-white py-4"
>
	<audio bind:this={remoteAudio} id="audioElement" controls class="hidden"> </audio>

	{#if isInCall}
		<div>
			<span class="call-time">{formatMilliseconds(time)}</span>
		</div>
		<div class="flex justify-center space-x-18">
			<Button variant="ghost" class="flex h-auto w-28 flex-col items-center" on:click={activateMic}>
				{#if !isMicrophoneMuted}
					<Microphone class="size-6" />
					<span>{$t('common.button.mute')}</span>
				{:else}
					<MicrophoneOff class="size-6" />
					<span>{$t('common.button.unmute')}</span>
				{/if}
			</Button>
			<Button
				variant="ghost"
				class="flex h-auto w-28 flex-col items-center"
				on:click={activateSpeaker}
			>
				{#if !isSpeakerMuted}
					<VolumeUp class="size-6" />
				{:else}
					<VolumeMute class="size-6" />
				{/if}
				<span>{$t('common.button.speaker')}</span>
			</Button>
		</div>
	{/if}
	{#if errorMessage}
		<div class="text-red-500">
			<span>{$t(errorMessage)}</span>
		</div>
	{/if}
	<EmergencyCallButton
		isActive={isEmergency}
		onClick={activateCall}
		{buttonText}
		disabled={!canCall}
	/>
</div>
