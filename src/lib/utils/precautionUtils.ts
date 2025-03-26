import type { TabItem, InfoBoxItem, Link } from '$lib/types';
import deLocaleFile from '$lib/assets/locales/de.json';

/**
 * Type definition for the value of a nested object structure
 */
type NestedObjectType =
	| NestedObject
	| string
	| number
	| boolean
	| null
	| undefined
	| Array<string | number | boolean | null | undefined>;

/**
 * Type definition for a nested object structure
 */
type NestedObject = {
	[key: string]: NestedObjectType;
};

/**
 * Helper function to safely get a nested value from an object using a path string
 * @param obj - The object to access
 * @param path - Path to the property (e.g., 'content.precaution_infos.fire.title')
 * @returns The value if found, undefined otherwise
 */
const getNestedValue = (obj: NestedObject, path: string): NestedObjectType => {
	const keys = path.split('.');
	let result: NestedObjectType = obj;

	for (const key of keys) {
		if (result && typeof result === 'object' && !Array.isArray(result) && key in result) {
			result = result[key as keyof typeof result];
		} else {
			return undefined;
		}
	}

	return result;
};

/**
 * Helper function to check if a translation key exists in the JSON file
 * @param key - Translation key to check (e.g., 'content.precaution_infos.fire.title')
 * @returns True if key exists, false otherwise
 */
const keyExists = (key: string): boolean => {
	return getNestedValue(deLocaleFile, key) !== undefined;
};

/**
 * Creates TabItem objects based on the provided slugs and translations
 *
 * @param t - Translation function (still used for actual text display)
 * @param slugs - Array of precaution category slugs (e.g., ['personal_precautions', 'fire', 'flood', 'storm', 'cbrn'])
 * @returns Array of TabItem objects
 */
export const createPrecautionTabItems = (
	t: (key: string) => string,
	slugs: string[]
): TabItem[] => {
	return slugs.map((slug) => {
		const titleKey = `content.precaution_infos.${slug}.title`;
		const title = t(titleKey);
		const content: InfoBoxItem[] = [];

		// Process each section until we don't find anymore
		for (let sectionIndex = 1; ; sectionIndex++) {
			const section = sectionIndex.toString();
			const sectionTitleKey = `content.precaution_infos.${slug}.${section}.title`;

			// Check if this section exists directly in the JSON
			if (!keyExists(sectionTitleKey)) {
				break; // No more sections, exit the loop
			}

			const sectionTitle = t(sectionTitleKey);
			const textKey = `content.precaution_infos.${slug}.${section}.text`;
			const text = keyExists(textKey) ? t(textKey) : '';

			// Check for list content (array of strings)
			const list: string[] = [];
			const listPath = `content.precaution_infos.${slug}.${section}.list`;
			// If list exists, it's an object with numeric keys
			if (keyExists(listPath)) {
				const listObj = getNestedValue(deLocaleFile, listPath);

				const listLength = Object.keys(listObj as object).length;

				for (let listIndex = 1; listIndex <= listLength; listIndex++) {
					const listItemKey = `${listPath}.${listIndex}`;
					if (keyExists(listItemKey)) {
						list.push(t(listItemKey));
					}
				}
			}

			// Determine if we have text or list content
			const textBodyOrList: string | string[] = list.length > 0 ? list : text;

			// Get links if any
			const links: Link[] = [];
			const linksPath = `content.precaution_infos.${slug}.${section}.links`;

			if (keyExists(linksPath)) {
				const linksObj = getNestedValue(deLocaleFile, linksPath);

				const linkKeys = Object.keys(linksObj as object)
					.map(Number)
					.sort((a, b) => a - b);

				for (const linkIndex of linkKeys) {
					const linkTextKey = `${linksPath}.${linkIndex}.text`;
					if (!keyExists(linkTextKey)) {
						continue;
					}

					const linkText = t(linkTextKey);
					const linkHrefKey = `${linksPath}.${linkIndex}.href`;
					const href = keyExists(linkHrefKey) ? t(linkHrefKey) : '';

					const linkTargetKey = `${linksPath}.${linkIndex}.target`;
					const target = keyExists(linkTargetKey) ? t(linkTargetKey) : '';

					links.push({ text: linkText, href, target });
				}
			}

			content.push({
				title: sectionTitle,
				textBodyOrList,
				links
			});
		}

		return {
			title,
			slug,
			content
		};
	}) as TabItem[];
};
