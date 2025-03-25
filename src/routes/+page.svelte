<script lang="ts">
	import Phone from '../components/Phone.svelte';
	import Footer from '../components/Footer.svelte';
	import Header from '../components/Header.svelte';
	import MainContent from '../components/MainContent.svelte';
</script>

<div class="page-root mx-auto h-full w-[375px] scroll-auto">
	<Header></Header>
	<Phone />
	<MainContent></MainContent>
	<Footer></Footer>
</div>

<style></style>
