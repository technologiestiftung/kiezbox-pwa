// src/lib/config/popup.ts
// Builds the rows of the map popup from a POI's properties and the city's poi/poi-map.json.
// What the properties mean depends on where a city's data comes from, so the city folder
// describes it, not the app.
import type { PoiField } from '$lib/types';

export interface PopupRow {
	/** Key in poi-map.json, unique per POI */
	property: string;
	/** Translation key below map.popup.labels, or plain text */
	label: string;
	/** boolean = ✓/✗ */
	value: boolean | string;
	/** value is a translation key below map.popup.values (or plain text), not a value from the data */
	translateValue: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Properties = Record<string, any>;

const normalize = (value: unknown) => String(value).trim().toLowerCase();

const matches = (value: unknown, candidates: string | number | (string | number)[]) =>
	(Array.isArray(candidates) ? candidates : [candidates]).some(
		(candidate) => normalize(candidate) === normalize(value)
	);

function readValue(properties: Properties, property: string, field: PoiField) {
	for (const key of [property, ...(field.alsoTry ?? [])]) {
		const value = properties[key];
		if (value !== undefined && value !== null && String(value).trim() !== '') return value;
	}
	return undefined;
}

function toRow(property: string, field: PoiField, properties: Properties): PopupRow | null {
	const value = readValue(properties, property, field);
	const row = { property, label: field.label, translateValue: false };

	switch (field.valueToDisplay) {
		case 'boolean':
			if (value === undefined) return null;
			if (matches(value, field.truthy)) return { ...row, value: true };
			if (field.falsy === undefined || matches(value, field.falsy)) return { ...row, value: false };
			return null;
		case 'text':
		case 'map': {
			if (value === undefined) {
				return field.fallback ? { ...row, value: field.fallback, translateValue: true } : null;
			}
			if (field.valueToDisplay === 'map') {
				const key = Object.keys(field.values).find((key) => matches(value, key));
				if (key) return { ...row, value: field.values[key], translateValue: true };
			}
			return { ...row, value: String(value) };
		}
	}
}

/** Rows in the order of the poi-map entries; properties without a value are left out */
export const popupRows = (fields: Record<string, PoiField>, properties: Properties) =>
	Object.entries(fields)
		.map(([property, field]) => toRow(property, field, properties))
		.filter((row) => row !== null);

/** POI name (file name without .json, the key in poi-map.json) of a source's data file */
export const poiName = (dataPath: string) =>
	dataPath
		.split('/')
		.pop()!
		.replace(/\.json$/, '');
