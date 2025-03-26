<script lang="ts">
	import { Microphone, MicrophoneOff, VolumeMute, VolumeUp } from 'carbon-icons-svelte';
	import EmergencyCallButton from './EmergencyCallButton.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let {
		isCall,
		isEmergency,
		isMicrophone,
		isSpeaker,
		activateMic,
		activateSpeaker,
		activateCall,
		buttonText
	} = $props();
</script>

<div class="callerScreen-root flex flex-col items-center justify-center space-y-4">
	{#if isCall}
		<div>
			<span class="call-time">00:00</span>
		</div>
		<div class="flex justify-center space-x-18">
			<Button variant="ghost" class="flex h-auto w-28 flex-col items-center" on:click={activateMic}>
				{#if isMicrophone}
					<MicrophoneOff class="size-6" />
					<span>Stumm schalten</span>
				{:else}
					<Microphone class="size-6" />
					<span>Entstummen</span>
				{/if}
			</Button>
			<Button
				variant="ghost"
				class="flex h-auto w-28 flex-col items-center"
				on:click={activateSpeaker}
			>
				{#if isSpeaker}
					<VolumeUp class="size-6" />
				{:else}
					<VolumeMute class="size-6" />
				{/if}
				<span>Lautsprecher</span>
			</Button>
		</div>
	{/if}
	<EmergencyCallButton isActive={isEmergency} onClick={activateCall} {buttonText} />
</div>
