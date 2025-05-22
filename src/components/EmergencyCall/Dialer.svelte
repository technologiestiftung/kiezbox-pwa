<script lang="ts">
	import { t } from '$lib/translations';
	import { onMount } from 'svelte';
	import EmergencyCallButton from './EmergencyCallButton.svelte';
	let { isEmergency, onClick } = $props();

	const observer = new IntersectionObserver(
		([e]) => e.target.classList.toggle('isSticky', e.intersectionRatio < 1),
		{ threshold: [1] }
	);

	onMount(() => {
		const stickyElm = document.querySelector('.Dialer-button');
		if (stickyElm) {
			observer.observe(stickyElm);
		} else {
			console.log('Sticky element found and observer attached');
		}
	});
</script>

<div
	class={`Dialer-root relative grid max-w-[43.75rem] justify-center ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}
>
	<div class=" flex justify-center p-6 md:w-[29rem]">
		<div class="notruf-container flex flex-col items-start">
			<span class="body-large-bold">
				{$t('content.emergency_phone.title')}
			</span>
			<span class="body-text">
				{$t('content.emergency_phone.text')}
			</span>
		</div>
	</div>
	<div
		class={`absolute -bottom-14 z-10 flex h-14 w-full justify-center ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}
	></div>
</div>

<div class={`Dialer-button group sticky -top-1 z-10 flex justify-center`}>
	<div
		class="w-full px-6 transition-[width] duration-200 ease-out group-[.isSticky]:w-full group-[.isSticky]:p-0 md:w-[29rem]"
	>
		<EmergencyCallButton
			disabled={false}
			isActive={isEmergency}
			{onClick}
			buttonText={isEmergency
				? $t('content.emergency_phone.emergency.phone_button')
				: $t('content.emergency_phone.default.phone_button')}
		/>
	</div>
</div>
<div
	class={`h-8 w-full shadow-[inset_0_-4px_6px_-5px_rgba(0,0,0,0.2)] ${isEmergency ? 'bg-notruf-light' : 'bg-purple-light'}`}
></div>
