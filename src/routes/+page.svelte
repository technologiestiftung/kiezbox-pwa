<script lang="ts">
	import EmergencyCall from '../components/EmergencyCall.svelte';
	import Ticker from '../components/Ticker.svelte';
</script>

<div class="page-root mx-auto max-w-[800px] p-4">
	<h1>Kiezbox Notfallapp</h1>

	<h2>Aktuelle News</h2>
	<Ticker />

	<h1>EmergencyCall</h1>
	<EmergencyCall />
</div>

<style></style>
