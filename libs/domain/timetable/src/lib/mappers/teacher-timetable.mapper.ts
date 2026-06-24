import { TimetableEntry } from '../models/timetable-entry.model';

export interface TeacherTimetableResponse {
  [day: string]: { [time: string]: TeacherRawEntry };
}

export interface TeacherRawEntry {
  subject: string;
  classroom: string;
  teacher?: string;
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4,
};

export function mapTeacherResponseToEntries(response: TeacherTimetableResponse): TimetableEntry[] {
  const entries: TimetableEntry[] = [];
  let idx = 0;

  for (const [dayName, slots] of Object.entries(response)) {
    const dayIndex = DAY_NAME_TO_INDEX[dayName];
    if (dayIndex === undefined) continue;

    for (const [time, raw] of Object.entries(slots)) {
      entries.push({
        id: idx + 1,
        academic_term: 0,
        day_of_week: dayIndex,
        day_name: dayName,
        tiered_period: idx + 1,
        period_name: '',
        period_sequence: idx + 1,
        period_start: time,
        period_end: '',
        year_group: 0,
        year_group_name: '',
        teacher: 0,
        teacher_name: raw.teacher ?? '',
        subject: 0,
        subject_code: '',
        subject_name: raw.subject,
        subject_category: '',
        room: null,
        room_detail: null,
        is_practical: false,
        practical_rooms: '',
        raw_cell_code: '',
      });
      idx++;
    }
  }

  return entries;
}
