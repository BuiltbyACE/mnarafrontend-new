/**
 * Environment Configuration
 * Centralized API and app settings
 */

/** API Configuration with ngrok backend */
export const environment = {
  production: false,
  apiBaseUrl: 'https://subcerebellar-colette-undichotomously.ngrok-free.dev/api/v1',
  authEndpoints: {
    login: '/accounts/auth/login/',
    me: '/accounts/auth/me/',
    refresh: '/accounts/auth/refresh/',
  },
  appName: 'Mnara ERP',
  version: '1.0.0',
};

/** Production environment override */
export const productionEnvironment = {
  ...environment,
  production: true,
};

/** Get full API URL for an endpoint */
export function getApiUrl(endpoint: string): string {
  return `${environment.apiBaseUrl}${endpoint}`;
}
