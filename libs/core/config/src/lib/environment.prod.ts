export const environment = {
  production: true,
  apiBaseUrl: 'https://api.mnaraschool.com/api/v1',
  authEndpoints: {
    login: '/accounts/auth/login/',
    me: '/accounts/auth/me/',
    refresh: '/accounts/auth/refresh/',
  },
};

export function getApiUrl(endpoint: string): string {
  return `${environment.apiBaseUrl}${endpoint}`;
}
