<script lang="ts">
	let { header, children, isVisible = false } = $props();

	const borderColor = $derived(isVisible ? 'border-black' : 'border-grey-accent');
	const borderTopColor = $derived(isVisible ? 'border-t-black' : 'border-t-grey-accent');
</script>

<div
	class={`SppechBubble-root relative mb-3 flex w-auto max-w-[329px] min-w-[200px] rounded-[1.5rem] border-4 bg-white px-[1.5rem] py-[1.375rem] text-start shadow-xl transition-colors duration-500 ${borderColor} ${borderTopColor}`}
>
	<div class="SpeechBubble-content">
		<span class="speechBubble-header text-black">{@html header}</span>
		<p class="speechBubble-body text-black">{@html children}</p>
	</div>

	<div class="SpeechBubble-tail absolute -bottom-3 left-3">
		<div class="relative h-0 w-0">
			<div
				class={`absolute -bottom-[8px] -left-[4px] h-0 w-0 rounded-bl-md border-t-[20px] border-r-[30px] border-l-[0px] transition-colors duration-500 ${borderTopColor} border-r-transparent border-l-transparent`}
			></div>
			<div
				class="absolute bottom-[0px] left-0 h-0 w-0 border-t-[14px] border-r-[21px] border-l-[-5px] border-t-white border-r-transparent border-l-transparent"
			></div>
		</div>
	</div>
</div>
