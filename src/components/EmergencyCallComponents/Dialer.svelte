<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import EmergencyCallButton from './EmergencyCallButton.svelte';
	let { isEmergency, onClick } = $props();
	import { t } from '$lib/translations';
</script>

<div
	class={`Dialer-root grid max-w-[43.75rem] justify-center ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}
>
	<div class=" relative flex justify-center p-6 md:w-[29rem]">
		<div class="notruf-container flex flex-col items-start">
			<span class="body-large-bold">
				{$t('content.emergency_phone.title')}
			</span>
			<span class="body-text">
				{$t('content.emergency_phone.text')}
			</span>
		</div>
	</div>
</div>
<div
	class={`sticky top-0 z-10 flex justify-center ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}
>
	<div class="w-full px-6 md:w-[29rem]">
		<EmergencyCallButton
			isActive={isEmergency}
			{onClick}
			buttonText={$t('content.emergency_phone.default.phone_button')}
		/>
	</div>
</div>
<div
	class={`h-8 w-full shadow-[inset_0_-4px_6px_-5px_rgba(0,0,0,0.2)] ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}
></div>
