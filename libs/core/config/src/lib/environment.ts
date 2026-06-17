export const environment = {
  production: false,
  apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
  authEndpoints: {
    login: '/accounts/auth/login/',
    me: '/accounts/auth/me/',
    refresh: '/accounts/auth/refresh/',
  },
};

export function getApiUrl(endpoint: string): string {
  return `${environment.apiBaseUrl}${endpoint}`;
}
