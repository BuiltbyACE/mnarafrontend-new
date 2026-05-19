/**
 * Sibling State Service
 * Manages the active child/ward selection for multi-child families
 */

import { Injectable, signal, computed } from '@angular/core';

export interface SiblingProfile {
  id: string;
  name: string;
  form: string;
  initials: string;
}

@Injectable({
  providedIn: 'root',
})
export class SiblingStateService {
  private readonly _siblings = signal<SiblingProfile[]>([
    { id: '1', name: 'Wesley Figueroa', form: 'Form 3', initials: 'WF' },
    { id: '2', name: 'Alice Figueroa', form: 'Year 6', initials: 'AF' },
  ]);

  private readonly _activeSiblingId = signal<string>('1');

  readonly siblings = this._siblings.asReadonly();

  readonly activeSiblingId = this._activeSiblingId.asReadonly();

  readonly activeSibling = computed(() => {
    return this._siblings().find((s) => s.id === this._activeSiblingId()) ?? this._siblings()[0];
  });

  setActiveSibling(sibling: SiblingProfile): void {
    this._activeSiblingId.set(sibling.id);
  }

  setActiveSiblingById(id: string): void {
    this._activeSiblingId.set(id);
  }
}