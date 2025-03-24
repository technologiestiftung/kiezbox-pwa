import i18n from 'sveltekit-i18n';

/** @type {import('sveltekit-i18n').Config} */
const config = {
	initLocale: 'de',
	fallbackLocale: 'de', // Use a proper fallback locale
	loaders: [
		{
			locale: 'de',
			key: 'common', // Assign a proper key
			loader: async () => (await import('./de/common.json')).default
		},
		{
			locale: 'de',
			key: 'pm',
			loader: async () => (await import('./de/preventions_and_means.json')).default
		}
	]
};

export const { t, locale, locales, loading, loadTranslations } = new i18n(config);
