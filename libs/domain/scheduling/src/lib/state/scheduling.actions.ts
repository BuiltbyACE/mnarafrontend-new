import { createActionGroup, props, emptyProps } from '@ngrx/store';
import {
  TimetableVersion,
  TimetableEntry,
  TeachingRequirement,
  BellSchedule,
  EntryDraft,
  ConflictError,
} from '../models';

export const SchedulingActions = createActionGroup({
  source: 'Scheduling',
  events: {
    'Load Versions': props<{ termId: number }>(),
    'Load Versions Success': props<{ versions: TimetableVersion[] }>(),
    'Load Versions Failure': props<{ error: string }>(),

    'Load Entries': props<{ versionId: number }>(),
    'Load Entries Success': props<{ entries: TimetableEntry[] }>(),
    'Load Entries Failure': props<{ error: string }>(),

    'Load Requirements': props<{ termId: number; versionId?: number }>(),
    'Load Requirements Success': props<{ requirements: TeachingRequirement[] }>(),
    'Load Requirements Failure': props<{ error: string }>(),

    'Load Bell Schedules': props<{ keyStage?: number }>(),
    'Load Bell Schedules Success': props<{ schedules: BellSchedule[] }>(),
    'Load Bell Schedules Failure': props<{ error: string }>(),

    'Add Entry Optimistic': props<{ draft: EntryDraft; tempId: string }>(),
    'Entry Created': props<{ entry: TimetableEntry; tempId: string }>(),
    'Entry Rejected': props<{ tempId: string; errors: ConflictError[] }>(),

    'Delete Entry': props<{ id: number }>(),
    'Delete Entry Success': props<{ id: number }>(),
    'Delete Entry Failure': props<{ error: string }>(),

    'Publish Version': props<{ id: number }>(),
    'Publish Version Success': props<{ version: TimetableVersion }>(),
    'Publish Version Failure': props<{ error: string }>(),

    'Set Active Version': props<{ versionId: number }>(),

    'Clear Rejected': emptyProps(),

    'Set Filters': props<{
      filters: { teacherId?: number; yearLevelId?: number } | null;
    }>(),
  },
});
