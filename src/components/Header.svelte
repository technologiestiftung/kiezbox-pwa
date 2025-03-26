<script lang="ts">
	import wimmelbild from '$lib/assets/GDB-Wimmelbild.png';
	import logo from '$lib/assets/kiezbox-logo.svg';
	import { t } from '$lib/translations';
</script>

{#snippet figure()}
	<figure class="">
		<img alt="wimmelbild" src={wimmelbild} />
	</figure>
{/snippet}

<div
	class="Header-root grid w-full grid-cols-4 place-items-center items-center self-center py-6 md:w-[29rem]"
>
	<div class="mr-4">{@render figure()}</div>
	<div class="col-span-2 flex h-full flex-col justify-end">
		<img alt="logo" src={logo} />
		<h1 class="text-purple-dark">{$t('common.header.title')}</h1>
	</div>
	<div class="ml-4 -scale-x-100">{@render figure()}</div>
</div>
