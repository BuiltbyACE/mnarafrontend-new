export type {
  BellSchedule,
  BellSchedulePeriod,
  TimetableVersion,
  TimetableEntry,
  TeachingRequirement,
  TimetableAuditLog,
  EntryDraft,
  ConflictError,
  ValidationResult,
  DateVersionResponse,
  Teacher,
  YearLevel,
} from './lib/models';

export { SchedulingApiService } from './lib/scheduling-api.service';
export { validateEntryOptimistic } from './lib/conflict-mirror';
export { SchedulingFacade } from './lib/scheduling.facade';
export * from './lib/state/scheduling.state';
export * from './lib/state/scheduling.actions';
export * from './lib/state/scheduling.selectors';
export { schedulingReducer } from './lib/state/scheduling.reducer';
export { SchedulingEffects } from './lib/state/scheduling.effects';
export {
  mapEntriesToEvents,
  mapPeriodsToNonTeachingEvents,
  getSubjectColor,
  getPeriodColor,
} from './lib/adapters/timetable-entry.mapper';
export { buildCalendarOptions } from './lib/adapters/fullcalendar-config';
