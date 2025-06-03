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

	const formatCallDuration = (seconds: number): string => {
		const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
		const remainingSeconds = String(seconds % 60).padStart(2, '0');
		return `${minutes}:${remainingSeconds}`;
	};
</script>

<div
	class="CallScreen-root sticky bottom-0 z-10 flex w-full flex-col items-center justify-center bg-white py-4"
>
	<audio bind:this={remoteAudio} id="audioElement" controls class="hidden"> </audio>

	{#if isInCall}
		<div>
			<span class="call-time">{formatCallDuration(time)}</span>
		</div>
		<div class="mb-4 flex w-full justify-around">
			<Button
				variant="ghost"
				class="flex h-auto w-28 cursor-pointer flex-col items-center"
				on:click={activateMic}
			>
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
				class="flex h-auto w-28 cursor-pointer flex-col items-center"
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
	<EmergencyCallButton
		isActive={isEmergency}
		onClick={activateCall}
		{buttonText}
		disabled={!canCall}
	/>
</div>
