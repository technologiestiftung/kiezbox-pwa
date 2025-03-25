import i18n from 'sveltekit-i18n';

/** @type {import('sveltekit-i18n').Config} */
const config = {
	initLocale: 'de',
	fallbackLocale: 'de',
	loaders: [
		{
			locale: 'de',
			key: '',
			loader: async () => (await import('./assets/locales/de.json')).default
		}
	]
};

export const { t, locale, locales, loading, loadTranslations } = new i18n(config);
