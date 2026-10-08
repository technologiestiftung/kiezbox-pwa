<script lang="ts">
	import { Accordion as AccordionPrimitive, type WithoutChildrenOrChild } from "bits-ui";
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<AccordionPrimitive.ContentProps> & { children?: Snippet } = $props();
</script>

<AccordionPrimitive.Content bind:ref forceMount {...restProps}>
	{#snippet child({ props, open })}
		{#if open}
			<div
				{...props}
				class={cn("overflow-hidden text-sm transition-all", className)}
				transition:slide={{ duration: 200 }}
			>
				<div class="pb-4 pt-0">
					{@render children?.()}
				</div>
			</div>
		{/if}
	{/snippet}
</AccordionPrimitive.Content>
