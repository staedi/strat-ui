/// <reference types="vite/client" />

// In development (/strat-data): served by Vite middleware from ../strat-data on disk.
// In production: GitHub raw CDN, set via .env.production.
export const BASE_URL: string = import.meta.env.VITE_DATA_BASE_URL ?? ''
