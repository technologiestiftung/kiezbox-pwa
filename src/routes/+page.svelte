<script lang="ts">
	import EmergencyCall from '../components/EmergencyCall.svelte';
	import Footer from '../components/Footer.svelte';
	import Header from '../components/Header.svelte';
	import Map from '../components/Map.svelte';
	import PrecautionGuide from '../components/PrecautionGuide.svelte';
</script>

<div class="page-root mx-auto flex h-full max-w-[43.75rem] flex-col scroll-auto bg-white">
	<Header></Header>
	<EmergencyCall />
	<PrecautionGuide></PrecautionGuide>
	<div class="map-root flex h-[30.5rem] w-full items-center justify-center">
		<Map />
	</div>
	<Footer></Footer>
</div>

<style></style>
