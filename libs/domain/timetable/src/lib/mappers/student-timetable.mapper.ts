import { TimetableEntry } from '../models/timetable-entry.model';
import { TimetableEvent } from '../models/timetable-event.model';

export interface StudentTimetableResponse {
  events: StudentRawEvent[];
  lessons: StudentRawLesson[];
}

export interface StudentRawEvent {
  id: number;
  title: string;
  type: 'holiday' | 'exam' | 'special';
  start_date: string;
  end_date: string;
  color: string;
}

export interface StudentRawLesson {
  id: number;
  day_of_week: string;
  subject_name: string;
  teacher_name: string;
  room: string;
  start_time: string;
  end_time: string;
  color: string;
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4,
};

export function mapStudentResponseToEntries(response: StudentTimetableResponse): TimetableEntry[] {
  return response.lessons.map((lesson, idx) => ({
    id: lesson.id,
    academic_term: 0,
    day_of_week: DAY_NAME_TO_INDEX[lesson.day_of_week] ?? 0,
    day_name: lesson.day_of_week,
    tiered_period: idx + 1,
    period_name: '',
    period_sequence: idx + 1,
    period_start: lesson.start_time,
    period_end: lesson.end_time,
    year_group: 0,
    year_group_name: '',
    teacher: 0,
    teacher_name: lesson.teacher_name,
    subject: 0,
    subject_code: '',
    subject_name: lesson.subject_name,
    subject_category: '',
    room: null,
    room_detail: null,
    is_practical: false,
    practical_rooms: '',
    raw_cell_code: '',
  }));
}

export function mapStudentResponseToEvents(response: StudentTimetableResponse): TimetableEvent[] {
  return response.events.map((event) => ({
    id: event.id,
    title: event.title,
    type: event.type,
    start_date: event.start_date,
    end_date: event.end_date,
    color: event.color,
  }));
}
