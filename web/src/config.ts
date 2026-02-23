/**
 * Centralized Configuration for Puculuxa Web App
 * All environment-dependent values should be imported from here.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export const APP_CONFIG = {
    apiUrl: API_BASE_URL,
    appName: 'Puculuxa Admin',
    version: '1.0.0',
} as const;
