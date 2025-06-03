export interface LayerConfig {
	id: string;
	label: string;
	icon?: string;
	alt: string;
	type: 'symbol' | 'raster';
	source: string;
	layout?: {
		visibility?: 'visible' | 'none';
		'icon-image'?: string;
		'icon-size'?: number;
	};
	// todo fix any type
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	paint?: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getContent?: (properties: Record<string, any>) => Record<string, string | boolean | null>;
}

export const BASE_LAYER_CONFIG: LayerConfig[] = [
	{
		id: 'osm-local-layer',
		label: 'map.legend.layers.osm-local-layer',
		alt: 'OpenStreetMap Local',
		type: 'raster',
		source: 'osmLocal',
		layout: {
			visibility: 'visible'
		},
		paint: {
			'raster-saturation': -1,
			'raster-contrast': 0.2,
			'raster-opacity': 1
		}
	}
];

export const LAYER_CONFIG: LayerConfig[] = [
	{
		id: 'drinking-water-layer',
		label: 'map.legend.layers.drinking-water-layer',
		icon: '/icons/drinking-water.svg',
		alt: 'Trinkwasser Icon',
		type: 'symbol',
		source: 'drinkingWater',
		layout: {
			visibility: 'visible',
			'icon-image': 'drinking-water-icon',
			'icon-size': 0.3
		},
		getContent: (properties) => ({
			Name: properties.bezeichnun
		})
	},
	{
		id: 'water-pumps-layer',
		label: 'map.legend.layers.water-pumps-layer',
		icon: '/icons/water-pump.svg',
		alt: 'Wasserpumpe Icon',
		type: 'symbol',
		source: 'waterPumps',
		layout: {
			visibility: 'visible',
			'icon-image': 'water-pump-icon',
			'icon-size': 0.3
		},
		getContent: (properties) => ({
			Status: properties['pump:status'] === 'ok' ? 'funktioniert' : 'kaputt',
			Trinkwasser: properties.drinking_water === 'yes',
			Überprüft_am: properties.check_date
		})
	},
	{
		id: 'toilets-layer',
		label: 'map.legend.layers.toilets-layer',
		icon: '/icons/toilet.svg',
		alt: 'Toiletten Icon',
		type: 'symbol',
		source: 'toilets',
		layout: {
			visibility: 'visible',
			'icon-image': 'toilet-icon',
			'icon-size': 0.3
		},
		getContent: (properties) => ({
			Kostenfrei: properties.nutzungsentgelt === 0,
			Barrierefrei: properties.barrierefrei === 'ja',
			Wickeltisch: properties.wickeltisch === 'ja',
			Pissoir: properties.kostenfreies_pissoir === 'ja'
		})
	},
	{
		id: 'defies-layer',
		label: 'map.legend.layers.defies-layer',
		icon: '/icons/defie.svg',
		alt: 'Defibrillator Icon',
		type: 'symbol',
		source: 'defies',
		layout: {
			visibility: 'visible',
			'icon-image': 'defibrillator-icon',
			'icon-size': 0.3
		},
		getContent: (properties) => ({
			Öffnungszeiten: properties.opening_hours || 'unbekannt',
			Standort:
				properties['defibrillator:location'] ||
				properties['defibrillator:location:de'] ||
				'unbekannt',
			Telefon: properties.phone || properties['contact:phone'] || 'unbekannt',
			Betreiber: properties.operator || properties['defibrillator:wikipedia'] || 'unbekannt'
		})
	}
];
