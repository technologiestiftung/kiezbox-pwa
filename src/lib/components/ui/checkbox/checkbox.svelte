<script lang="ts">
	import { Checkbox as CheckboxPrimitive, type WithoutChildrenOrChild } from "bits-ui";
	import Check from "lucide-svelte/icons/check";
	import Minus from "lucide-svelte/icons/minus";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	bind:checked
	bind:indeterminate
	class={cn(
		"border-purple-dark ring-offset-background focus-visible:ring-ring data-[state=checked]:bg-white data-[state=checked]:text-purple-dark peer box-content h-6 w-6 shrink-0 rounded-[2px] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 shadow-[0px_0px_8px_0px_rgba(93,80,139,0.16)]",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div class="flex h-6 w-6 items-center justify-center text-current">
			{#if indeterminate}
				<Minus class="h-5 w-5" />
			{:else if checked}
				<Check class="h-5 w-5" />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
