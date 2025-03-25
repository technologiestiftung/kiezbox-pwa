<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	type $$Props = TabsPrimitive.ListProps;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<TabsPrimitive.List
	class={cn('bg-purple-light text-muted-foreground flex justify-center', className)}
	{...$$restProps}
>
	<slot />
</TabsPrimitive.List>
