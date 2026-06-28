export const environment = {
  production: false,
  apiBaseUrl: 'https://subcerebellar-colette-undichotomously.ngrok-free.dev/api/v1',
  authEndpoints: {
    login: '/accounts/auth/login/',
    me: '/accounts/auth/me/',
    refresh: '/accounts/auth/refresh/',
  },
};

export function getApiUrl(endpoint: string): string {
  return `${environment.apiBaseUrl}${endpoint}`;
}
