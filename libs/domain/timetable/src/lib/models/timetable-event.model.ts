export type EventType = 'holiday' | 'exam' | 'special';

export interface TimetableEvent {
  id: number;
  title: string;
  type: EventType;
  start_date: string;
  end_date: string;
  color: string;
}
