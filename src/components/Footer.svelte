<script lang="ts">
	import logo_complete from '$lib/assets/logo-complete.svg';
	import logo_sponsor from '$lib/assets/logo-sponsor.svg';
	import logo from '$lib/assets/logo.svg';
	import ts_berlin_logo from '$lib/assets/ts-berlin-logo.svg';
	import { t } from '$lib/translations';
</script>

<div class="Footer-root bg-tsb-blau flex flex-col items-start justify-center space-y-6 p-6">
	<div class="flex flex-col space-y-2.5 md:hidden">
		<span class="body-text-bold text-white"> {$t('common.footer.initiatve_by')}</span>
		<figure class="">
			<img alt="logo" src={logo} />
		</figure>
	</div>
	<div class="flex flex-col space-y-2.5 md:hidden">
		<span class="body-text-bold text-white"> {$t('common.footer.funded_by')} </span>
		<figure class="">
			<img alt="logo_sponsor" src={logo_sponsor} />
		</figure>
	</div>
	<div class=" hidden flex-col space-y-2.5 md:flex">
		<span class="body-text-bold text-white"> {$t('common.footer.funded_by')} </span>
		<figure class="">
			<img alt="logo_complete" src={logo_complete} />
		</figure>
	</div>

	<div
		class="flex w-full flex-col items-center justify-between space-y-6 space-x-6 md:flex-row md:space-y-0"
	>
		<div class="hidden flex-col space-y-2.5 md:flex">
			<span class="body-text-bold text-white"> {$t('common.footer.created_by')} </span>
			<a
				href={$t('common.footer.imprint.href')}
				class="text-white underline"
				target="_blank"
				rel="noopener noreferrer"
			>
				<figure class="">
					<img alt="ts_berlin_logo" class="w-48 fill-white text-white" src={ts_berlin_logo} />
				</figure>
			</a>
		</div>
		<div class="flex flex-col space-y-2.5 text-end md:order-2">
			<div></div>
			<a
				href={$t('common.footer.privacy.href')}
				class="text-white underline"
				target="_blank"
				rel="noopener noreferrer"
			>
				{$t('common.footer.privacy.text')}
			</a>
			<a
				href={$t('common.footer.imprint.href')}
				class="text-white underline"
				target="_blank"
				rel="noopener noreferrer"
			>
				{$t('common.footer.imprint.text')}
			</a>
			<span class="caption text-white"> {$t('common.footer.acknowledgement')}</span>
		</div>
	</div>
</div>
