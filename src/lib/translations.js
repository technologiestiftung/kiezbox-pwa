import i18n from 'sveltekit-i18n';
import city from './generated/city.json';

// City-specific texts from cities/<slug>/locales/<lang>.json (copied by scripts/prepare-city.js)
const cityOverrides = import.meta.glob('./generated/locales/*.json', { import: 'default' });

/**
 * @param {Record<string, any>} base
 * @param {Record<string, any>} override
 * @returns {Record<string, any>}
 */
function deepMerge(base, override) {
	const result = { ...base };
	for (const [key, value] of Object.entries(override)) {
		const isObject = value && typeof value === 'object' && !Array.isArray(value);
		result[key] = isObject && base[key] ? deepMerge(base[key], value) : value;
	}
	return result;
}

/**
 * @param {string} locale
 * @param {() => Promise<{ default: Record<string, any> }>} loadBase
 */
function withCityOverride(locale, loadBase) {
	return async () => {
		const base = (await loadBase()).default;
		const loadOverride = cityOverrides[`./generated/locales/${locale}.json`];
		if (!loadOverride) return base;
		return deepMerge(base, /** @type {Record<string, any>} */ (await loadOverride()));
	};
}

/** @type {import('sveltekit-i18n').Config} */
const config = {
	initLocale: city.defaultLocale,
	fallbackLocale: 'de',
	loaders: [
		{
			locale: 'de',
			key: '',
			loader: withCityOverride('de', () => import('./assets/locales/de.json'))
		},
		{
			locale: 'en',
			key: '',
			loader: withCityOverride('en', () => import('./assets/locales/en.json'))
		},
		{
			locale: 'fr',
			key: '',
			loader: withCityOverride('fr', () => import('./assets/locales/fr.json'))
		},
		{
			locale: 'it',
			key: '',
			loader: withCityOverride('it', () => import('./assets/locales/it.json'))
		},
		{
			locale: 'es',
			key: '',
			loader: withCityOverride('es', () => import('./assets/locales/es.json'))
		},
		{
			locale: 'tr',
			key: '',
			loader: withCityOverride('tr', () => import('./assets/locales/tr.json'))
		}
	]
};

export const { t, locale, locales, loading, loadTranslations } = new i18n(config);
