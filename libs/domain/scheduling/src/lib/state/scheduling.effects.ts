import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { SchedulingApiService } from '../scheduling-api.service';
import { SchedulingActions } from './scheduling.actions';
import { Store } from '@ngrx/store';
import { selectActiveVersion, selectEntries } from './scheduling.selectors';

@Injectable()
export class SchedulingEffects {
  private actions$ = inject(Actions);
  private api = inject(SchedulingApiService);
  private store = inject(Store);

  loadVersions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulingActions.loadVersions),
      switchMap(({ termId }) =>
        this.api.getVersions(termId).pipe(
          map(versions => SchedulingActions.loadVersionsSuccess({ versions })),
          catchError(() => of(SchedulingActions.loadVersionsFailure({ error: 'Failed to load versions' }))),
        ),
      ),
    ),
  );

  loadEntries$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulingActions.loadEntries),
      switchMap(({ versionId }) =>
        this.api.getTimetableEntries({ version: versionId }).pipe(
          map(entries => SchedulingActions.loadEntriesSuccess({ entries })),
          catchError(() => of(SchedulingActions.loadEntriesFailure({ error: 'Failed to load entries' }))),
        ),
      ),
    ),
  );

  loadRequirements$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulingActions.loadRequirements),
      switchMap(({ termId, versionId }) =>
        this.api.getRequirements(termId, versionId).pipe(
          map(requirements => SchedulingActions.loadRequirementsSuccess({ requirements })),
          catchError(() => of(SchedulingActions.loadRequirementsFailure({ error: 'Failed to load requirements' }))),
        ),
      ),
    ),
  );

  loadBellSchedules$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulingActions.loadBellSchedules),
      switchMap(({ keyStage }) =>
        this.api.getBellSchedules(keyStage).pipe(
          map(schedules => SchedulingActions.loadBellSchedulesSuccess({ schedules })),
          catchError(() => of(SchedulingActions.loadBellSchedulesFailure({ error: 'Failed to load schedules' }))),
        ),
      ),
    ),
  );

  createEntry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulingActions.addEntryOptimistic),
      switchMap(({ draft, tempId }) =>
        this.api.createEntry(draft).pipe(
          map(entry => SchedulingActions.entryCreated({ entry, tempId })),
          catchError(err => {
            const errors = err.error?.errors ?? [{ rule: 'UNKNOWN', code: 'UNKNOWN', message: 'Failed to create entry', context: {} }];
            return of(SchedulingActions.entryRejected({ tempId, errors }));
          }),
        ),
      ),
    ),
  );

  deleteEntry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulingActions.deleteEntry),
      switchMap(({ id }) =>
        this.api.deleteEntry(id).pipe(
          map(() => SchedulingActions.deleteEntrySuccess({ id })),
          catchError(() => of(SchedulingActions.deleteEntryFailure({ error: 'Failed to delete entry' }))),
        ),
      ),
    ),
  );

  publishVersion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulingActions.publishVersion),
      switchMap(({ id }) =>
        this.api.publishVersion(id).pipe(
          switchMap(() => this.api.getVersions().pipe(
            map(versions => {
              const published = versions.find(v => v.id === id);
              return SchedulingActions.publishVersionSuccess({
                version: published ?? { id, status: 'PUBLISHED' } as any,
              });
            }),
          )),
          catchError(() => of(SchedulingActions.publishVersionFailure({ error: 'Failed to publish version' }))),
        ),
      ),
    ),
  );

  setActiveVersion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SchedulingActions.setActiveVersion),
      switchMap(({ versionId }) => [
        SchedulingActions.loadEntries({ versionId }),
      ]),
    ),
  );
}
