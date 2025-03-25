<script lang="ts">
	import logo from '$lib/assets/logo.svg';
	import logo_sponsor from '$lib/assets/logo-sponsor.svg';
</script>

<div class="bg-tsb-blau flex flex-col space-y-6 p-6">
	<div class="flex flex-col space-y-2.5">
		<span class="body-text-bold text-white"> Eine Maßnahme von: </span>
		<figure class="">
			<img alt="logo" src={logo} />
		</figure>
	</div>
	<div class="flex flex-col space-y-2.5">
		<span class="body-text-bold text-white"> Gefördert von: </span>
		<figure class="">
			<img alt="logo_sponsor" src={logo_sponsor} />
		</figure>
	</div>
	<div class="flex flex-col space-y-2.5">
		<a
			href=""
			class="body-text-bold text-white underline"
			target="_blank"
			rel="noopener noreferrer"
		>
			Datenschutz
		</a>
		<a
			href=""
			class="body-text-bold text-white underline"
			target="_blank"
			rel="noopener noreferrer"
		>
			Impressum
		</a>
	</div>
	<div class="flex flex-col space-y-2.5">
		<span class="caption text-white">Illustration Key Visual: L. Hoff, aufsiemitgebrüll.de </span>
		<span class="body-text text-white"> © 2025 Technologiestiftung Berlin</span>
	</div>
</div>
