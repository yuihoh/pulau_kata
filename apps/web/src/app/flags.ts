/**
 * Lab mode: prototype games are linked on Home and can be opened without unlocking.
 * On in dev and on staging (`VITE_SHOW_LAB=true`), never in production.
 */
export const LAB_MODE = import.meta.env.DEV || import.meta.env.VITE_SHOW_LAB === 'true';
