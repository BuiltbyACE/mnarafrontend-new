export type ConflictType = 'TEACHER' | 'YEAR_GROUP' | 'ROOM' | 'AVAILABILITY' | 'CAPACITY' | 'PROTECTED_BLOCK';
export type ConflictSeverity = 'ERROR' | 'WARNING';

export interface TimetableConflict {
  conflict_type: ConflictType;
  entry_a_id: number | null;
  entry_b_id: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  description: string;
  severity: ConflictSeverity;
}

export interface ConflictCheckResponse {
  count: number;
  conflicts: TimetableConflict[];
}
