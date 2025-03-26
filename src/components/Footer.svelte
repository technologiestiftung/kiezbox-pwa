<script lang="ts">
	import logo from '$lib/assets/logo.svg';
	import logo_sponsor from '$lib/assets/logo-sponsor.svg';
	import logo_complete from '$lib/assets/logo-complete.svg';
	import { t } from '$lib/translations';
</script>

<div class="bg-tsb-blau flex flex-col items-start justify-center space-y-6 p-6">
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
	<div class="flex w-full flex-col justify-between space-y-6 md:flex-row md:space-y-0">
		<div class="flex flex-col space-y-2.5 md:order-2">
			<a
				href={$t('common.footer.privacy.href')}
				class="body-text-bold text-white underline"
				target="_blank"
				rel="noopener noreferrer"
			>
				{$t('common.footer.privacy.text')}
			</a>
			<a
				href={$t('common.footer.imprint.href')}
				class="body-text-bold text-white underline"
				target="_blank"
				rel="noopener noreferrer"
			>
				{$t('common.footer.imprint.text')}
			</a>
		</div>
		<div class="flex flex-col space-y-2.5">
			<span class="caption text-white"> {$t('common.footer.acknowledgement')}</span>
			<span class="body-text text-white">
				<a href={$t('common.footer.copyright.href')} target="_blank" rel="noopener noreferrer">
					{$t('common.footer.copyright.text')}
				</a>
			</span>
		</div>
	</div>
</div>
