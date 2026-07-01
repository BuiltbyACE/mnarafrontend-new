import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SchedulingState, versionsAdapter, entriesAdapter, requirementsAdapter, bellSchedulesAdapter } from './scheduling.state';

export const selectSchedulingState = createFeatureSelector<SchedulingState>('scheduling');

const { selectAll: selectAllVersions } = versionsAdapter.getSelectors();
const { selectAll: selectAllEntries } = entriesAdapter.getSelectors();
const { selectAll: selectAllRequirements } = requirementsAdapter.getSelectors();
const { selectAll: selectAllBellSchedules } = bellSchedulesAdapter.getSelectors();

export const selectVersions = createSelector(selectSchedulingState, s => selectAllVersions(s.versions));
export const selectEntries = createSelector(selectSchedulingState, s => selectAllEntries(s.entries));
export const selectRequirements = createSelector(selectSchedulingState, s => selectAllRequirements(s.requirements));
export const selectBellSchedules = createSelector(selectSchedulingState, s => selectAllBellSchedules(s.bellSchedules));

export const selectActiveVersionId = createSelector(selectSchedulingState, s => s.activeVersionId);

export const selectActiveVersion = createSelector(
  selectVersions,
  selectActiveVersionId,
  (versions, id) => versions.find(v => v.id === id) ?? null,
);

export const selectDraftEntries = createSelector(
  selectActiveVersion,
  selectEntries,
  (version, entries) => {
    if (!version || version.status !== 'DRAFT') return [];
    return entries;
  },
);

export const selectPublishedEntries = createSelector(
  selectEntries,
  entries => entries.filter(_e => true),
);

export const selectLoading = createSelector(selectSchedulingState, s => s.loading);

export const selectVersionById = (id: number) => createSelector(
  selectVersions,
  versions => versions.find(v => v.id === id) ?? null,
);

export const selectRequirementsForTerm = (termId: number) => createSelector(
  selectRequirements,
  reqs => reqs.filter(r => r.term === termId),
);

export const selectFilteredEntries = createSelector(
  selectEntries,
  selectSchedulingState,
  (entries, state) => {
    const filters = state.filters;
    if (!filters) return entries;
    return entries.filter(e => {
      const matchTeacher = !filters.teacherId || e.teacher_id === filters.teacherId;
      const matchYearLevel = !filters.yearLevelId || e.year_level === filters.yearLevelId;
      return matchTeacher && matchYearLevel;
    });
  },
);

export const selectEntriesByDay = (day: number) => createSelector(
  selectEntries,
  entries => entries.filter(e => e.day_of_week === day),
);
