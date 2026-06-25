import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadResult {
  photoUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AvatarUploadService {
  private http = inject(HttpClient);

  readonly isUploading = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly lastResult = signal<UploadResult | null>(null);

  /** Validate file before uploading. Returns error string or null. */
  validate(file: File): string | null {
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 2MB.`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP.`;
    }
    if (file.size === 0) {
      return 'File is empty.';
    }
    return null;
  }

  /** Create a local object URL for preview. */
  setPreview(file: File): void {
    this.clearPreview();
    this.previewUrl.set(URL.createObjectURL(file));
  }

  clearPreview(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.previewUrl.set(null);
  }

  /** Upload avatar to backend via PATCH multipart. */
  upload(file: File): void {
    const validationError = this.validate(file);
    if (validationError) {
      this.error.set(validationError);
      return;
    }

    this.error.set(null);
    this.isUploading.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.http.patch<{ photo_url: string }>(
      getApiUrl('/accounts/avatar/'),
      formData,
    ).pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: (res) => {
          this.clearPreview();
          this.lastResult.set({ photoUrl: res.photo_url });
        },
        error: (err) => {
          const msg = err.error?.error || err.statusText || 'Upload failed';
          this.error.set(msg);
        },
      });
  }

  reset(): void {
    this.clearPreview();
    this.error.set(null);
    this.lastResult.set(null);
  }
}
