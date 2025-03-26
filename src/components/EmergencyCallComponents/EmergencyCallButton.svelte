<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import { Phone } from 'carbon-icons-svelte';
	let { onClick, isActive, buttonText } = $props();
</script>

<Button
	class={`flex h-[3.3125rem]  w-full cursor-pointer flex-col items-center  ${isActive ? 'bg-notruf-rot hover:bg-notruf-rot' : 'bg-purple-mid hover:bg-purple-dark'}`}
	on:click={onClick}
>
	<Phone class="size-[1.5rem]" />
	{buttonText}</Button
>
