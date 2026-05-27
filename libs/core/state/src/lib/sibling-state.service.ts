import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '@sms/core/config';

export interface SiblingProfile {
  id: string;
  name: string;
  form: string;
  initials: string;
}

@Injectable({ providedIn: 'root' })
export class SiblingStateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly _siblings = signal<SiblingProfile[]>([]);
  private readonly _activeSiblingId = signal<string>('');
  private readonly _loading = signal(false);

  readonly siblings = this._siblings.asReadonly();
  readonly activeSiblingId = this._activeSiblingId.asReadonly();
  readonly loadingProfiles = this._loading.asReadonly();

  readonly activeSibling = computed(() => {
    return this._siblings().find((s) => s.id === this._activeSiblingId());
  });

  loadProfiles(): void {
    this._siblings.set([]);
    this._activeSiblingId.set('');
    this._loading.set(true);
    this.http.get<{results: any[]}>(`${this.baseUrl}/students/profiles/`).subscribe({
      next: (res) => {
        const mapped = res.results.map((p: any) => ({
          id: String(p.id),
          name: `${p.first_name} ${p.last_name}`,
          form: p.current_class_name || '',
          initials: ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase(),
        }));
        this._siblings.set(mapped);
        if (mapped.length > 0) {
          this._activeSiblingId.set(mapped[0].id);
        }
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  setActiveSibling(sibling: SiblingProfile): void {
    this._activeSiblingId.set(sibling.id);
  }

  setActiveSiblingById(id: string): void {
    this._activeSiblingId.set(id);
  }
}
