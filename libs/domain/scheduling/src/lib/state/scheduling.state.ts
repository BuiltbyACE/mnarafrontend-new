import { EntityState, createEntityAdapter } from '@ngrx/entity';
import {
  TimetableVersion,
  TimetableEntry,
  TeachingRequirement,
  BellSchedule,
} from '../models';

export const versionsAdapter = createEntityAdapter<TimetableVersion>();
export const entriesAdapter = createEntityAdapter<TimetableEntry>({
  selectId: e => e.id,
  sortComparer: (a, b) => a.day_of_week - b.day_of_week,
});
export const requirementsAdapter = createEntityAdapter<TeachingRequirement>();
export const bellSchedulesAdapter = createEntityAdapter<BellSchedule>();

export interface SchedulingState {
  versions: EntityState<TimetableVersion>;
  entries: EntityState<TimetableEntry>;
  requirements: EntityState<TeachingRequirement>;
  bellSchedules: EntityState<BellSchedule>;
  activeVersionId: number | null;
  optimistic: {
    pending: Record<string, TimetableEntry>;
    rejected: Record<string, unknown>;
  };
  loading: boolean;
}

export const initialSchedulingState: SchedulingState = {
  versions: versionsAdapter.getInitialState(),
  entries: entriesAdapter.getInitialState(),
  requirements: requirementsAdapter.getInitialState(),
  bellSchedules: bellSchedulesAdapter.getInitialState(),
  activeVersionId: null,
  optimistic: { pending: {}, rejected: {} },
  loading: false,
};
