/**
 * Admin Error Interceptor
 * Handles HTTP errors specific to admin operations
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AdminErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    let message = 'An unexpected error occurred';
    let duration = 5000;

    switch (error.status) {
      case 400:
        // Validation errors - parse field errors
        if (error.error && typeof error.error === 'object') {
          const fieldErrors = Object.entries(error.error)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          message = fieldErrors || 'Invalid data provided';
        } else {
          message = error.error?.message || 'Invalid request';
        }
        break;

      case 401:
        message = 'Session expired. Please log in again.';
        duration = 3000;
        this.router.navigate(['/login']);
        break;

      case 403:
        message = 'Insufficient permissions for this operation';
        break;

      case 405:
        message = 'Operation not allowed. This record cannot be modified or deleted.';
        break;

      case 404:
        message = 'Resource not found';
        break;

      case 409:
        message = error.error?.message || 'Conflict with existing data';
        break;

      case 422:
        message = error.error?.message || 'Validation failed';
        break;

      case 500:
      case 502:
      case 503:
        message = 'Server error. Please try again later.';
        console.error('Server error:', error);
        break;

      default:
        message = error.error?.message || error.message || 'An unexpected error occurred';
    }

    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: error.status >= 500 ? 'error-snackbar' : 'warning-snackbar',
    });
  }
}
