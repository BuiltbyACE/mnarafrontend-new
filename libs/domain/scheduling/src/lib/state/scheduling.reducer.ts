import { createReducer, on } from '@ngrx/store';
import { SchedulingActions } from './scheduling.actions';
import {
  initialSchedulingState,
  versionsAdapter,
  entriesAdapter,
  requirementsAdapter,
  bellSchedulesAdapter,
} from './scheduling.state';
import { TimetableEntry } from '../models';

export const schedulingReducer = createReducer(
  initialSchedulingState,

  on(SchedulingActions.loadVersions, state => ({
    ...state,
    loading: true,
  })),
  on(SchedulingActions.loadVersionsSuccess, (state, { versions }) => ({
    ...state,
    versions: versionsAdapter.setAll(versions, state.versions),
    loading: false,
  })),
  on(SchedulingActions.loadVersionsFailure, state => ({
    ...state,
    loading: false,
  })),

  on(SchedulingActions.loadEntries, state => ({
    ...state,
    loading: true,
  })),
  on(SchedulingActions.loadEntriesSuccess, (state, { entries }) => ({
    ...state,
    entries: entriesAdapter.setAll(entries, state.entries),
    loading: false,
  })),
  on(SchedulingActions.loadEntriesFailure, state => ({
    ...state,
    loading: false,
  })),

  on(SchedulingActions.loadRequirements, state => ({
    ...state,
    loading: true,
  })),
  on(SchedulingActions.loadRequirementsSuccess, (state, { requirements }) => ({
    ...state,
    requirements: requirementsAdapter.setAll(requirements, state.requirements),
    loading: false,
  })),
  on(SchedulingActions.loadRequirementsFailure, state => ({
    ...state,
    loading: false,
  })),

  on(SchedulingActions.loadBellSchedules, state => ({
    ...state,
    loading: true,
  })),
  on(SchedulingActions.loadBellSchedulesSuccess, (state, { schedules }) => ({
    ...state,
    bellSchedules: bellSchedulesAdapter.setAll(schedules, state.bellSchedules),
    loading: false,
  })),
  on(SchedulingActions.loadBellSchedulesFailure, state => ({
    ...state,
    loading: false,
  })),

  on(SchedulingActions.addEntryOptimistic, (state, { draft, tempId }) => {
    const pendingEntry: TimetableEntry = {
      id: Number(tempId),
      timetable_version: draft.timetable_version_id,
      course_workspace: draft.course_workspace_id,
      bell_schedule_period: draft.bell_schedule_period_id,
      day_of_week: draft.day_of_week,
      year_level: draft.year_level_id,
      teacher_id: draft.teacher_id ?? 0,
      subject_offering_id: 0,
      classroom_name: '',
      subject_name: '',
      published_teacher_id: null,
      published_teacher_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return {
      ...state,
      entries: entriesAdapter.addOne(pendingEntry, state.entries),
      optimistic: {
        ...state.optimistic,
        pending: { ...state.optimistic.pending, [tempId]: pendingEntry },
      },
    };
  }),
  on(SchedulingActions.entryCreated, (state, { entry, tempId }) => {
    const { [tempId]: _removed, ...restPending } = state.optimistic.pending;
    return {
      ...state,
      entries: entriesAdapter.removeOne(Number(tempId), state.entries),
      optimistic: { ...state.optimistic, pending: restPending },
    };
  }),
  on(SchedulingActions.entryRejected, (state, { tempId, errors }) => {
    const { [tempId]: _removed, ...restPending } = state.optimistic.pending;
    return {
      ...state,
      entries: entriesAdapter.removeOne(Number(tempId), state.entries),
      optimistic: {
        pending: restPending,
        rejected: { ...state.optimistic.rejected, [tempId]: errors },
      },
    };
  }),

  on(SchedulingActions.deleteEntry, state => ({
    ...state,
    loading: true,
  })),
  on(SchedulingActions.deleteEntrySuccess, (state, { id }) => ({
    ...state,
    entries: entriesAdapter.removeOne(id, state.entries),
    loading: false,
  })),
  on(SchedulingActions.deleteEntryFailure, state => ({
    ...state,
    loading: false,
  })),

  on(SchedulingActions.publishVersion, state => ({
    ...state,
    loading: true,
  })),
  on(SchedulingActions.publishVersionSuccess, (state, { version }) => ({
    ...state,
    versions: versionsAdapter.updateOne(
      { id: version.id, changes: version },
      state.versions,
    ),
    loading: false,
  })),
  on(SchedulingActions.publishVersionFailure, state => ({
    ...state,
    loading: false,
  })),

  on(SchedulingActions.setActiveVersion, (state, { versionId }) => ({
    ...state,
    activeVersionId: versionId,
  })),

  on(SchedulingActions.clearRejected, state => ({
    ...state,
    optimistic: { ...state.optimistic, rejected: {} },
  })),

  on(SchedulingActions.setFilters, (state, { filters }) => ({
    ...state,
    filters,
  })),
);
