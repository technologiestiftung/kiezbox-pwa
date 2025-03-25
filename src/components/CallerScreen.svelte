<script lang="ts">
	import EmergencyCallButton from './EmergencyCallButton.svelte';
	let { isCall, activateCall, buttonText } = $props();
</script>

<div>
	<EmergencyCallButton isActive={isCall} onClick={activateCall} {buttonText} />
</div>
