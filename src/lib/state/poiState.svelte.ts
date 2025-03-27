// todo: fix any type
interface PoiState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layer: any;
}

export const poiState = $state<PoiState>({
  properties: null,
  layer: null
});