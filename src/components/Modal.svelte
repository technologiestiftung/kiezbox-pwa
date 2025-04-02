<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { t } from '$lib/translations';
	import { CloseOutline } from 'carbon-icons-svelte';

	let { children, isModal, close } = $props();

	$effect(() => {
		if (isModal) dialog?.showModal();
		else dialog?.close();
	});

	let dialog = $state();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={close}
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
	class="modal-root [&[open]]:animate-zoom [&[open]::backdrop]:animate-fade [&::backdrop]:bg-body-black/85
    fixed inset-0 m-auto rounded md:h-[41.25rem] md:w-[29rem] [&::backdrop]:backdrop-blur-sm"
>
	<div class="bg-purple-light flex h-12 items-center justify-between">
		<Button
			variant="ghost"
			class="text-body-black justfiy-center flex w-32 items-center space-x-2"
			on:click={close}
		>
			<CloseOutline class="text-body-black size-6" />
			<span class="text-body-black">{$t('common.button.close')}</span>
		</Button>
	</div>
	<div
		class="md-[41.25rem] text-body-black flex h-[calc(100%-3rem)] w-full flex-col overflow-auto bg-white px-4"
	>
		{@render children?.()}
	</div>
	<Toaster></Toaster>
</dialog>

<style>
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
