<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { t } from '$lib/translations';
	import { CloseOutline } from 'carbon-icons-svelte';

	let { children, isModal, close, disabled } = $props();

	$effect(() => {
		if (isModal) {
			dialog?.showModal();
			document.body.style.overflow = 'hidden'; // ⛔ Prevent background scroll
		} else {
			dialog?.close();
			document.body.style.overflow = ''; // ✅ Restore scroll
		}
	});
	let dialog: HTMLDialogElement | undefined = $state();
	let contentContainer: HTMLElement | undefined = $state();
</script>

<!-- eslint-disable-next-line svelte/valid-compile -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={close}
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
	class="modal-root [&[open]]:animate-zoom [&[open]::backdrop]:animate-fade [&::backdrop]:bg-body-black/85
    fixed inset-0 m-auto h-[calc(100vh-6rem)] rounded md:h-[45rem] md:w-[29rem] [&::backdrop]:backdrop-blur-sm"
>
	<div class="bg-purple-light sticky flex h-12 items-center justify-end">
		<Button
			variant="ghost"
			class="text-body-black justfiy-center flex w-32 cursor-pointer items-center space-x-2"
			on:click={close}
			{disabled}
		>
			<span class="text-body-black">{$t('common.button.close')}</span>
			<CloseOutline class="text-body-black size-6" />
		</Button>
	</div>
	<div
		bind:this={contentContainer}
		class="text-body-black top-12 flex h-[calc(100vh-9rem)] w-full flex-col overflow-auto overscroll-contain bg-white px-4 md:h-[42rem]"
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
