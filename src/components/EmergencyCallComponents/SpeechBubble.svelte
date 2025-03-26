<script lang="ts">
	let { header, children } = $props();
</script>

<div
	class="speechBubble-root relative mb-3 flex w-auto max-w-[329px] min-w-[200px] rounded-[1.5rem] border-4 border-black bg-white px-[1.5rem] py-[1.375rem] text-start shadow-xl"
>
	<!-- Main Bubble Content -->
	<div class="speechBubble-content">
		<span class="speechBubble-header text-black">{@html header}</span>
		<p class="speechBubble-body text-black">{@html children}</p>
	</div>

	<!-- Tail using pseudo-elements -->
	<div class="speechBubble-tail absolute -bottom-3 left-3">
		<!-- Triangle with Border using Pseudo-Elements -->
		<div class="relative h-0 w-0">
			<!-- Outer Border Triangle -->
			<div
				class="absolute -bottom-[8px] -left-[4px] h-0 w-0
            rounded-bl-md border-t-[20px] border-r-[30px]
            border-l-[0px]
            border-t-black border-r-transparent
       border-l-transparent"
			></div>

			<!-- Inner Triangle (Speech Bubble Color) -->
			<div
				class="absolute bottom-[0px] left-0 h-0 w-0
            border-t-[14px] border-r-[21px]
            border-l-[-5px] border-t-white
            border-r-transparent border-l-transparent"
			></div>
		</div>
	</div>
</div>

<style>
</style>
