export interface BellSchedule {
  id: number;
  name: string;
  tier: 'EYF' | 'KS1' | 'KS2' | 'KS3';
  applies_on_days: number[];
  is_active: boolean;
  period_count?: number;
  year_levels?: number[];
  periods?: TieredPeriod[];
}

export interface TieredPeriod {
  id: number;
  schedule: number;
  name: string;
  sequence: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  period_type: 'ACADEMIC' | 'INSTITUTIONAL' | 'BREAK' | 'TRANSITION';
  institutional_block_type: string | null;
  is_assignable: boolean;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4;

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  0: 'Mon',
  1: 'Tue',
  2: 'Wed',
  3: 'Thu',
  4: 'Fri',
};
