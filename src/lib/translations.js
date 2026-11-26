import { I18n } from 'sveltekit-i18n';
import { CITY_PATH } from './config/city';

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
		const override = await fetchCityOverride(locale);
		return override ? deepMerge(base, override) : base;
	};
}

/**
 * City-specific texts from /city/locales/<lang>.json. Optional: a city without overrides for
 * this language (404) or unreachable city data just keeps the base texts.
 * @param {string} locale
 * @returns {Promise<Record<string, any> | null>}
 */
async function fetchCityOverride(locale) {
	try {
		const response = await fetch(`${CITY_PATH}/locales/${locale}.json`);
		return response.ok ? await response.json() : null;
	} catch {
		return null;
	}
}

// No initLocale: the root layout calls loadTranslations() with the city's defaultLocale
// once the city data is loaded.
/** @type {import('sveltekit-i18n').Config} */
const config = {
	fallbackLocale: 'de',
	loaders: [
		{
			locale: 'de',
			namespace: '',
			loader: withCityOverride('de', () => import('./assets/locales/de.json'))
		},
		{
			locale: 'en',
			namespace: '',
			loader: withCityOverride('en', () => import('./assets/locales/en.json'))
		},
		{
			locale: 'fr',
			namespace: '',
			loader: withCityOverride('fr', () => import('./assets/locales/fr.json'))
		},
		{
			locale: 'it',
			namespace: '',
			loader: withCityOverride('it', () => import('./assets/locales/it.json'))
		},
		{
			locale: 'es',
			namespace: '',
			loader: withCityOverride('es', () => import('./assets/locales/es.json'))
		},
		{
			locale: 'tr',
			namespace: '',
			loader: withCityOverride('tr', () => import('./assets/locales/tr.json'))
		}
	]
};

// Keep the instance: locale, locales and loading are reactive properties on it; destructured they
// would be one-time snapshots. t stays reactive as a function.
export const i18n = new I18n(config);
export const { t } = i18n;
