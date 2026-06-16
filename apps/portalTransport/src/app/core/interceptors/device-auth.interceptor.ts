import { HttpInterceptorFn } from '@angular/common/http';

const DEVICE_TOKEN_KEY = 'mnara_device_token';

export const deviceAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem(DEVICE_TOKEN_KEY);
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
