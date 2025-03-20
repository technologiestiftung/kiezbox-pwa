import { writable } from 'svelte/store';

// Define a store to track the selected POI
// TODO fix any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectedPOI = writable < null | { properties: any, layer: any }>(null);
