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
		},
		{
			locale: 'en',
			key: '',
			loader: async () => (await import('./assets/locales/en.json')).default
		},
		{
			locale: 'fr',
			key: '',
			loader: async () => (await import('./assets/locales/fr.json')).default
		},
		{
			locale: 'it',
			key: '',
			loader: async () => (await import('./assets/locales/it.json')).default
		},
		{
			locale: 'es',
			key: '',
			loader: async () => (await import('./assets/locales/es.json')).default
		},
		{
			locale: 'tr',
			key: '',
			loader: async () => (await import('./assets/locales/tr.json')).default
		}
	]
};

export const { t, locale, locales, loading, loadTranslations } = new i18n(config);
