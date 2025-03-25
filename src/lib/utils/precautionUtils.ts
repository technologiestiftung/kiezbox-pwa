import type { TabItem, InfoBoxItem, Link } from '$lib/types';

/**
 * Helper function to check if a translation exists
 * @param t - Translation function
 * @param key - Translation key to check
 * @returns True if translation exists, false otherwise
 */
const translationExists = (t: any, key: string): boolean => {
	const value = t(key);

	return value !== key; // If value equals key, translation doesn't exist
};

/**
 * Creates TabItem objects based on the provided slugs and translations
 *
 * @param t - Translation function
 * @param slugs - Array of precaution category slugs (e.g., ['personal_precautions', 'fire', 'flood', 'storm', 'cbrn'])
 * @returns Array of TabItem objects
 */
export const createPrecautionTabItems = (t: any, slugs: string[]): TabItem[] => {
	return slugs.map((slug) => {
		const title = t(`content.precaution_infos.${slug}.title`);
		const content: InfoBoxItem[] = [];

		// Process each section until we don't find anymore
		for (let sectionIndex = 1; ; sectionIndex++) {
			const section = sectionIndex.toString();
			const sectionTitleKey = `content.precaution_infos.${slug}.${section}.title`;

			// Check if this section exists
			if (!translationExists(t, sectionTitleKey)) {
				break; // No more sections, exit the loop
			}

			const sectionTitle = t(sectionTitleKey);
			const textKey = `content.precaution_infos.${slug}.${section}.text`;
			const text = translationExists(t, textKey) ? t(textKey) : '';

			// Check for list content (array of strings)
			const list: string[] = [];

			// Try to access list items
			for (let listIndex = 0; ; listIndex++) {
				const listItemKey = `content.precaution_infos.${slug}.${section}.list.${listIndex}`;
				if (!translationExists(t, listItemKey)) {
					break; // No more list items
				}
				list.push(t(listItemKey));
			}

			// Determine if we have text or list content
			const textBodyOrList: string | string[] = list.length > 0 ? list : text;

			// Get links if any
			const links: Link[] = [];

			for (let linkIndex = 1; ; linkIndex++) {
				const linkTextKey = `content.precaution_infos.${slug}.${section}.links.${linkIndex}.text`;
				if (!translationExists(t, linkTextKey)) {
					break; // No more links
				}

				const linkText = t(linkTextKey);
				const linkHrefKey = `content.precaution_infos.${slug}.${section}.links.${linkIndex}.href`;
				const href = translationExists(t, linkHrefKey) ? t(linkHrefKey) : undefined;

				const linkTargetKey = `content.precaution_infos.${slug}.${section}.links.${linkIndex}.target`;
				const target = translationExists(t, linkTargetKey) ? t(linkTargetKey) : undefined;

				links.push({ text: linkText, href, target });
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
	});
};
