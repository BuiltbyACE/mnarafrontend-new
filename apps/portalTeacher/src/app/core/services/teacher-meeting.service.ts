import { Injectable, signal, computed } from '@angular/core';
import { Meeting } from '../../shared/models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherMeetingService {
  private readonly data = signal<Meeting[]>([
    {
      id: '1', title: 'All Staff Meeting – Term 2 Kick-off',
      date: '2026-05-20', time: '14:00', endTime: '15:30',
      organizer: 'Principal\'s Office', description: 'Opening meeting for Term 2. Agenda includes: term overview, new curriculum updates, staff welfare announcements, and departmental reports. All teaching and non-teaching staff are required to attend.',
      attendeeCount: 48, joinUrl: 'https://meet.google.com/abc-defg-hij', location: 'School Hall',
    },
    {
      id: '2', title: 'Science Department Meeting',
      date: '2026-05-19', time: '11:00', endTime: '12:00',
      organizer: 'Dr. Sarah Kimani', description: 'Weekly Science Department meeting to discuss lesson plans, lab schedules, and the upcoming science fair. Bring your termly schemes of work.',
      attendeeCount: 12, location: 'Science Lab B',
    },
    {
      id: '3', title: 'Parent-Teacher Conference – Form 2',
      date: '2026-05-25', time: '09:00', endTime: '15:00',
      organizer: 'Academic Affairs', description: 'Scheduled parent-teacher meetings for Form 2 parents. Each teacher will have a 15-minute slot per parent. Timetable will be shared by May 22nd.',
      attendeeCount: 24, joinUrl: 'https://teams.microsoft.com/meeting/xyz', location: 'Various Classrooms',
    },
    {
      id: '4', title: 'Sports Day Planning Committee',
      date: '2026-05-22', time: '13:00', endTime: '14:00',
      organizer: 'Mr. John Mwangi', description: 'Planning committee meeting for the annual Sports Day event scheduled for June 15th. Discuss logistics, events, and resource allocation.',
      attendeeCount: 8, location: 'Staff Room',
    },
    {
      id: '5', title: 'Term 1 Staff Meeting',
      date: '2026-04-10', time: '14:00', endTime: '15:30',
      organizer: 'Principal\'s Office', description: 'End of Term 1 staff meeting covering performance review, examination results analysis, and holiday assignments.',
      attendeeCount: 52, location: 'School Hall',
    },
    {
      id: '6', title: 'Department Heads Meeting',
      date: '2026-04-05', time: '10:00', endTime: '11:30',
      organizer: 'Deputy Principal', description: 'Meeting with all Heads of Department to review term 1 academic performance and plan for term 2. Budget proposals for term 2 to be submitted.',
      attendeeCount: 9, location: 'Conference Room A',
    },
  ]);

  readonly allMeetings = this.data.asReadonly();

  readonly upcomingMeetings = computed(() =>
    this.data().filter(m => new Date(m.date) >= new Date(new Date().toDateString()))
  );

  readonly pastMeetings = computed(() =>
    this.data().filter(m => new Date(m.date) < new Date(new Date().toDateString()))
  );

  fetchMeetings(): void {
    // mock - data already loaded
  }
}
