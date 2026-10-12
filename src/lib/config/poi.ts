// src/lib/config/poi.ts
// The POI layers of the map come from the city data: "pois" in city.config.json lists them, the
// rest follows from the name: data in poi/<poi>.json, icons in icons/<poi>.{png,svg} of the city
// (else the app's /icons/<poi>.{png,svg}; a city icon without .svg shows its .png in the legend),
// legend label map.legend.layers.<poi>.
import { cityUrl, getCity } from './city';

/** Must match DEFAULT_POIS in scripts/lib/city.js */
export const DEFAULT_POIS = ['drinking-water', 'water-pumps', 'toilets', 'defibrillator'];

export interface PoiLayer {
	/** Name of the POI, also the map source id and the key in poi-map.json */
	poi: string;
	layerId: string;
	/** Translation key */
	label: string;
	/** GeoJSON file, relative to /city/ */
	data: string;
	/** PNG for the map symbol */
	mapIcon: string;
	/** SVG (or the city's PNG) for the legend */
	legendIcon: string;
}

const cityIcon = (file: string) => (getCity().files.includes(file) ? cityUrl(file) : null);

/** Only call after loadCity() resolved (the root layout waits for it) */
export const poiLayers = (): PoiLayer[] =>
	(getCity().pois ?? DEFAULT_POIS).map((poi) => ({
		poi,
		layerId: `${poi}-layer`,
		label: `map.legend.layers.${poi}`,
		data: `poi/${poi}.json`,
		mapIcon: cityIcon(`icons/${poi}.png`) ?? `/icons/${poi}.png`,
		legendIcon: cityIcon(`icons/${poi}.svg`) ?? cityIcon(`icons/${poi}.png`) ?? `/icons/${poi}.svg`
	}));
