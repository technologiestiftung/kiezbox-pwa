<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive, type WithoutChildrenOrChild } from "bits-ui";
	import { fade } from "svelte/transition";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<AlertDialogPrimitive.OverlayProps> = $props();
</script>

<AlertDialogPrimitive.Overlay bind:ref forceMount {...restProps}>
	{#snippet child({ props, open })}
		{#if open}
			<div
				{...props}
				class={cn("bg-background/80 fixed inset-0 z-50 backdrop-blur-sm", className)}
				transition:fade={{ duration: 150 }}
			></div>
		{/if}
	{/snippet}
</AlertDialogPrimitive.Overlay>
