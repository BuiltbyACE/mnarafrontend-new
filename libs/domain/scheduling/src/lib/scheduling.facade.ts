import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { SchedulingActions } from './state/scheduling.actions';
import {
  selectVersions,
  selectEntries,
  selectRequirements,
  selectBellSchedules,
  selectActiveVersion,
  selectActiveVersionId,
  selectLoading,
  selectVersionById,
  selectRequirementsForTerm,
} from './state/scheduling.selectors';
import { EntryDraft } from './models';
import { Observable } from 'rxjs';
import { TimetableVersion, TimetableEntry, TeachingRequirement, BellSchedule } from './models';

let tempIdCounter = 0;
function nextTempId(): string {
  return `temp_${Date.now()}_${++tempIdCounter}`;
}

@Injectable({ providedIn: 'root' })
export class SchedulingFacade {
  private store = inject(Store);

  readonly versions$ = this.store.select(selectVersions);
  readonly entries$ = this.store.select(selectEntries);
  readonly requirements$ = this.store.select(selectRequirements);
  readonly bellSchedules$ = this.store.select(selectBellSchedules);
  readonly activeVersion$ = this.store.select(selectActiveVersion);
  readonly activeVersionId$ = this.store.select(selectActiveVersionId);
  readonly loading$ = this.store.select(selectLoading);

  versionById(id: number): Observable<TimetableVersion | null> {
    return this.store.select(selectVersionById(id));
  }

  requirementsForTerm(termId: number): Observable<TeachingRequirement[]> {
    return this.store.select(selectRequirementsForTerm(termId));
  }

  loadVersions(termId: number): void {
    this.store.dispatch(SchedulingActions.loadVersions({ termId }));
  }

  loadEntries(versionId: number): void {
    this.store.dispatch(SchedulingActions.loadEntries({ versionId }));
  }

  loadRequirements(termId: number, versionId?: number): void {
    this.store.dispatch(SchedulingActions.loadRequirements({ termId, versionId }));
  }

  loadBellSchedules(keyStage?: number): void {
    this.store.dispatch(SchedulingActions.loadBellSchedules({ keyStage }));
  }

  addEntry(draft: EntryDraft): void {
    const tempId = nextTempId();
    this.store.dispatch(SchedulingActions.addEntryOptimistic({ draft, tempId }));
  }

  deleteEntry(id: number): void {
    this.store.dispatch(SchedulingActions.deleteEntry({ id }));
  }

  publishVersion(id: number): void {
    this.store.dispatch(SchedulingActions.publishVersion({ id }));
  }

  setActiveVersion(versionId: number): void {
    this.store.dispatch(SchedulingActions.setActiveVersion({ versionId }));
  }

  setFilters(filters: { teacherId?: number; yearLevelId?: number } | null): void {
    this.store.dispatch(SchedulingActions.setFilters({ filters }));
  }

  clearRejected(): void {
    this.store.dispatch(SchedulingActions.clearRejected());
  }
}
