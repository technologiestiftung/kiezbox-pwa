<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import EmergencyCallButton from './EmergencyCallButton.svelte';
	let { isEmergency, onClick } = $props();
	import { t } from '$lib/translations';
</script>

<div class={`notruf-root relative p-6 ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}>
	<div class="notruf-container flex flex-col items-start">
		<span class="body-large-bold">Für euch auch in der Krise da</span>
		<span class="body-text"
			>Teste hier unseren Demonotruf, der auch funktioniert, wenn sonst nichts mehr funktioniert.</span
		>
	</div>
</div>
<div class={`sticky top-0 px-6 ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}>
	<EmergencyCallButton
		isActive={isEmergency}
		{onClick}
		buttonText={$t('content.emergency_phone.default.phone_button')}
	/>
</div>
