<script>
	let { showModal = $bindable(), children, close = () => {} } = $props();

	let dialog = $state(); // HTMLDialogElement

	$effect(() => {
		if (showModal) dialog.showModal();
	});

	const handleClose = () => {
		showModal = false;
		close();
	};
</script>

{#if showModal}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<dialog
		bind:this={dialog}
		onclose={handleClose}
		onclick={(e) => {
			if (e.target === dialog) dialog.close();
		}}
		class="modal-root [&[open]]:animate-zoom [&[open]::backdrop]:animate-fade [&::backdrop]:bg-body-black/85
    fixed inset-0 m-auto flex h-[624px]
    w-[359px] flex-col rounded-xs [&::backdrop]:backdrop-blur-sm"
	>
		<div class="bg-purple-light h-12 p-2">
			<button autofocus onclick={() => dialog.close()}>close modal</button>
		</div>
		<div class="h-full flex-grow px-4 pt-14">
			{@render children?.()}
		</div>
	</dialog>
{/if}

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
