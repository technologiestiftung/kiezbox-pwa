<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import EmergencyCallButton from './EmergencyCallButton.svelte';
	let {
		isEmergency,
		buttons
	}: { isEmergency: boolean; buttons: { isActive: boolean; onClick: () => void }[] } = $props();
</script>

<div>
	<div
		class={`notruf-root flex w-[375px] flex-col space-y-[1.65rem] p-[1.438rem] ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}
	>
		<div class="notruf-container flex flex-col items-start">
			<span class="body-large-bold">Für euch auch in der Krise da</span>
			<span class="body-text"
				>Teste hier unseren Demonotruf, der auch funktioniert, wenn sonst nichts mehr funktioniert.</span
			>
		</div>
		{#each buttons as button}
			<EmergencyCallButton isActive={isEmergency} onClick={button.onClick} />
		{/each}
	</div>
</div>
