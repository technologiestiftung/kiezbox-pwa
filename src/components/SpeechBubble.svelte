<script>
	/**
	 * @type {HTMLElement}
	 */
	export let title;

	export let body = '';
</script>

<div class="speechBubble-root rounded-lg bg-white p-4 shadow-lg">
	<div class="speechBubble-title">
		{@html title.outerHTML}
	</div>
	<p class="speechBubble-body">{body}</p>
</div>

<style>
</style>
