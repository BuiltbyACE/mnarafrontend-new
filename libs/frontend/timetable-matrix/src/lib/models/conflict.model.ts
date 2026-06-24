export interface ConflictReport {
  conflict_type: 'TEACHER' | 'YEAR_GROUP' | 'ROOM' | 'AVAILABILITY' | 'CAPACITY' | 'PROTECTED_BLOCK';
  entry_a_id: number | null;
  entry_b_id: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  description: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ConflictCheckResponse {
  count: number;
  conflicts: ConflictReport[];
}
