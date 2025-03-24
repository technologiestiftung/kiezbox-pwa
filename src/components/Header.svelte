<script lang="ts">
	import wimmelbild from '$lib/assets/GDB-Wimmelbild.png';
	import logo from '$lib/assets/kiezbox-logo.svg';
</script>

{#snippet figure()}
	<figure class="">
		<img alt="wimmelbild" src={wimmelbild} />
	</figure>
{/snippet}

<div class="grid w-[375px] grid-cols-4 place-items-center items-center py-6">
	<div class="mr-4">{@render figure()}</div>
	<div class="col-span-2 flex h-full flex-col justify-end">
		<img alt="logo" src={logo} />
		<h1 class="text-purple-dark">Infoportal</h1>
	</div>
	<div class="ml-4 -scale-x-100">{@render figure()}</div>
</div>
