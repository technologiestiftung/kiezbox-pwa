<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import Check from "lucide-svelte/icons/check";
	import Minus from "lucide-svelte/icons/minus";
	import { cn } from "$lib/utils.js";

	type $$Props = CheckboxPrimitive.Props;
	type $$Events = CheckboxPrimitive.Events;

	let className: $$Props["class"] = undefined;
	export let checked: $$Props["checked"] = false;
	export { className as class };
</script>

<CheckboxPrimitive.Root
	class={cn(
		"border-purple-dark ring-offset-background focus-visible:ring-ring data-[state=checked]:bg-white data-[state=checked]:text-purple-dark peer box-content h-6 w-6 shrink-0 rounded-[2px] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 shadow-[0px_0px_8px_0px_rgba(93,80,139,0.16)]",
		className
	)}
	bind:checked
	{...$$restProps}
	on:click
>
	<CheckboxPrimitive.Indicator
		class={cn("flex h-6 w-6 items-center justify-center text-current")}
		let:isChecked
		let:isIndeterminate
	>
		{#if isChecked}
			<Check class="h-5 w-5" />
		{:else if isIndeterminate}
			<Minus class="h-5 w-5" />
		{/if}
	</CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
