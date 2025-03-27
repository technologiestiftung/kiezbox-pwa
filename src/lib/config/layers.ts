export interface LayerConfig {
  id: string;
  label: string;
  icon: string;
  alt: string;
  type: 'symbol' | 'raster';
  source: string;
  layout?: {
    visibility?: 'visible' | 'none';
    'icon-image'?: string;
    'icon-size'?: number;
  };
  // todo fix any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paint?: Record<string, any>;
}

export const BASE_LAYER_CONFIG: LayerConfig[] = [
    {
    id: 'osm-local-layer',
    label: 'OSM Local',
    icon: '/path/to/osm-icon.svg',
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
  },
]

export const LAYER_CONFIG: LayerConfig[] = [
  {
    id: 'water-pumps-layer',
    label: 'Wasserpumpe',
    icon: '/icons/water-pump.svg',
    alt: 'Wasserpumpe Icon',
    type: 'symbol',
    source: 'waterPumps',
    layout: {
      visibility: 'visible',
      'icon-image': 'water-pump-icon',
      'icon-size': 0.3
    }
  },
  {
    id: 'drinking-water-layer',
    label: 'Trinkwasser',
    icon: '/icons/drinking-water.svg',
    alt: 'Trinkwasser Icon',
    type: 'symbol',
    source: 'drinkingWater',
    layout: {
      visibility: 'visible',
      'icon-image': 'drinking-water-icon',
      'icon-size': 0.3
    }
  },
  {
    id: 'toilets-layer',
    label: 'Öffentliche Toilette',
    icon: '/icons/toilet.svg',
    alt: 'Toiletten Icon',
    type: 'symbol',
    source: 'toilets',
    layout: {
      visibility: 'visible',
      'icon-image': 'toilet-icon',
      'icon-size': 0.3
    }
  },
  {
    id: 'defies-layer',
    label: 'Defibrillatoren',
    icon: '/icons/defie.svg',
    alt: 'Defibrillator Icon',
    type: 'symbol',
    source: 'defies',
    layout: {
      visibility: 'visible',
      'icon-image': 'defibrillator-icon',
      'icon-size': 0.3
    }
  }
];