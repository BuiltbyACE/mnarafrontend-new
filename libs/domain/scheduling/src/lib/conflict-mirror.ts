import {
  EntryDraft,
  BellSchedulePeriod,
  TimetableEntry,
  ConflictError,
  ValidationResult,
} from './models';

export function validateEntryOptimistic(
  candidate: EntryDraft,
  snapshot: TimetableEntry[],
  periods: BellSchedulePeriod[],
): ValidationResult {
  const errors: ConflictError[] = [];
  const warnings: ConflictError[] = [];

  const period = periods.find(p => p.id === candidate.bell_schedule_period_id);

  if (!period) {
    errors.push({
      rule: 'R3', code: 'PERIOD_NOT_FOUND',
      message: 'Bell schedule period not found.',
      context: { bell_schedule_period_id: candidate.bell_schedule_period_id },
    });
    return { valid: false, errors, warnings };
  }

  if (period.period_type !== 'TEACHING_BLOCK') {
    errors.push({
      rule: 'R3', code: 'BLOCK_NOT_TEACHING',
      message: 'Cannot schedule into a break or institutional block.',
      context: { period_id: period.id, period_type: period.period_type },
    });
    return { valid: false, errors, warnings };
  }

  const teacherClash = candidate.teacher_id != null
    ? snapshot.find(e =>
        e.teacher_id === candidate.teacher_id &&
        e.bell_schedule_period === candidate.bell_schedule_period_id &&
        e.day_of_week === candidate.day_of_week
      )
    : undefined;
  if (teacherClash) {
    errors.push({
      rule: 'R1', code: 'TEACHER_DOUBLE_BOOK',
      message: 'Teacher is already assigned to another class in this period.',
      context: { clashing_entry_id: teacherClash.id },
    });
  }

  const yearLevelClash = snapshot.find(e =>
    e.year_level === candidate.year_level_id &&
    e.bell_schedule_period === candidate.bell_schedule_period_id &&
    e.day_of_week === candidate.day_of_week
  );
  if (yearLevelClash) {
    errors.push({
      rule: 'R2', code: 'YEAR_LEVEL_DOUBLE_BOOK',
      message: 'Year level already has a subject scheduled in this block.',
      context: { year_level_id: candidate.year_level_id },
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}
