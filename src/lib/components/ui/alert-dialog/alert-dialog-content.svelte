<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive, type WithoutChildrenOrChild } from "bits-ui";
	import type { Snippet } from "svelte";
	import * as AlertDialog from "./index.js";
	import { cn, flyAndScale } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<AlertDialogPrimitive.ContentProps> & {
		portalProps?: AlertDialogPrimitive.PortalProps;
		children?: Snippet;
	} = $props();
</script>

<AlertDialog.Portal {...portalProps}>
	<AlertDialog.Overlay />
	<AlertDialogPrimitive.Content bind:ref forceMount {...restProps}>
		{#snippet child({ props, open })}
			{#if open}
				<div
					{...props}
					class={cn(
						"bg-background fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg sm:rounded-lg md:w-full",
						className
					)}
					transition:flyAndScale
				>
					{@render children?.()}
				</div>
			{/if}
		{/snippet}
	</AlertDialogPrimitive.Content>
</AlertDialog.Portal>
