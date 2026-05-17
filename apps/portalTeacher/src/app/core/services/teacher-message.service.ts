import { Injectable, signal, computed } from '@angular/core';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

export interface Thread {
  id: string;
  participants: string[];
  subject: string;
  messages: Message[];
  lastMessagePreview: string;
  lastTimestamp: string;
  unread: boolean;
}

@Injectable({ providedIn: 'root' })
export class TeacherMessageService {
  readonly threads = signal<Thread[]>([
    {
      id: 'T1',
      participants: ['School Admin'],
      subject: 'Staff Meeting Agenda',
      lastMessagePreview: 'Please find the agenda for tomorrow\'s staff meeting attached.',
      lastTimestamp: '2026-05-17',
      unread: true,
      messages: [
        { id: 'M1', senderId: 'admin', senderName: 'School Admin', content: 'Good morning, please find the agenda for tomorrow\'s staff meeting attached.', timestamp: '2026-05-17 08:30', isMine: false },
        { id: 'M2', senderId: 'teacher', senderName: 'You', content: 'Thank you, I will review it before the meeting.', timestamp: '2026-05-17 08:45', isMine: true },
        { id: 'M3', senderId: 'admin', senderName: 'School Admin', content: 'Also, please prepare your termly progress report for discussion.', timestamp: '2026-05-17 09:00', isMine: false },
      ],
    },
    {
      id: 'T2',
      participants: ['Mrs. Wanjiku (HOD)'],
      subject: 'Curriculum Review',
      lastMessagePreview: 'The department heads have approved the new scheme of work.',
      lastTimestamp: '2026-05-16',
      unread: true,
      messages: [
        { id: 'M4', senderId: 'hod', senderName: 'Mrs. Wanjiku (HOD)', content: 'The department heads have approved the new scheme of work.', timestamp: '2026-05-16 14:00', isMine: false },
        { id: 'M5', senderId: 'teacher', senderName: 'You', content: 'That\'s great news. When should we start implementing?', timestamp: '2026-05-16 14:15', isMine: true },
        { id: 'M6', senderId: 'hod', senderName: 'Mrs. Wanjiku (HOD)', content: 'Starting next term. I will share the rollout plan shortly.', timestamp: '2026-05-16 14:30', isMine: false },
        { id: 'M7', senderId: 'teacher', senderName: 'You', content: 'Noted. Looking forward to the plan.', timestamp: '2026-05-16 14:45', isMine: true },
      ],
    },
    {
      id: 'T3',
      participants: ['Mr. & Mrs. Kamau (Parent)'],
      subject: 'Brian\'s Academic Progress',
      lastMessagePreview: 'Thank you for the update. We will work with Brian at home.',
      lastTimestamp: '2026-05-15',
      unread: false,
      messages: [
        { id: 'M8', senderId: 'teacher', senderName: 'You', content: 'Hello Mr. & Mrs. Kamau, I wanted to discuss Brian\'s recent performance in Mathematics.', timestamp: '2026-05-15 10:00', isMine: true },
        { id: 'M9', senderId: 'parent', senderName: 'Mr. & Mrs. Kamau (Parent)', content: 'Hello, thank you for reaching out. We have noticed he has been struggling.', timestamp: '2026-05-15 10:30', isMine: false },
        { id: 'M10', senderId: 'teacher', senderName: 'You', content: 'I recommend some extra tutoring sessions after school on Tuesdays and Thursdays.', timestamp: '2026-05-15 10:45', isMine: true },
        { id: 'M11', senderId: 'parent', senderName: 'Mr. & Mrs. Kamau (Parent)', content: 'That sounds like a good plan. We will make sure he attends.', timestamp: '2026-05-15 11:15', isMine: false },
        { id: 'M12', senderId: 'teacher', senderName: 'You', content: 'Perfect. I will start next Tuesday. I\'ll keep you updated on his progress.', timestamp: '2026-05-15 11:30', isMine: true },
      ],
    },
    {
      id: 'T4',
      participants: ['Sports Department'],
      subject: 'Inter-School Sports Tournament',
      lastMessagePreview: 'We need your class list for the athletics trials tomorrow.',
      lastTimestamp: '2026-05-14',
      unread: false,
      messages: [
        { id: 'M13', senderId: 'sports', senderName: 'Sports Department', content: 'We need your class list for the athletics trials tomorrow.', timestamp: '2026-05-14 09:00', isMine: false },
        { id: 'M14', senderId: 'teacher', senderName: 'You', content: 'I will send the list by end of day. How many students per event?', timestamp: '2026-05-14 09:30', isMine: true },
        { id: 'M15', senderId: 'sports', senderName: 'Sports Department', content: 'Maximum 3 per event. The trials start at 8 AM on the main field.', timestamp: '2026-05-14 10:00', isMine: false },
        { id: 'M16', senderId: 'teacher', senderName: 'You', content: 'Got it. Sending the list shortly.', timestamp: '2026-05-14 10:15', isMine: true },
      ],
    },
    {
      id: 'T5',
      participants: ['Lab Technician'],
      subject: 'Chemistry Lab Equipment',
      lastMessagePreview: 'The Bunsen burners have been serviced and are ready for use.',
      lastTimestamp: '2026-05-13',
      unread: false,
      messages: [
        { id: 'M17', senderId: 'lab', senderName: 'Lab Technician', content: 'The Bunsen burners have been serviced and are ready for use.', timestamp: '2026-05-13 11:00', isMine: false },
        { id: 'M18', senderId: 'teacher', senderName: 'You', content: 'Excellent. Can we also get the titration kits for next week\'s practical?', timestamp: '2026-05-13 11:30', isMine: true },
        { id: 'M19', senderId: 'lab', senderName: 'Lab Technician', content: 'Yes, I have already prepared them. They are in the prep room.', timestamp: '2026-05-13 12:00', isMine: false },
        { id: 'M20', senderId: 'teacher', senderName: 'You', content: 'Thank you. I will pick them up on Monday morning.', timestamp: '2026-05-13 12:15', isMine: true },
      ],
    },
  ]);

  readonly activeThreadId = signal<string | null>(null);

  readonly activeThread = computed(() => {
    const id = this.activeThreadId();
    if (!id) return null;
    return this.threads().find(t => t.id === id) ?? null;
  });

  selectThread(id: string): void {
    this.activeThreadId.set(id);
    this.threads.update(threads => threads.map(t => t.id === id ? { ...t, unread: false } : t));
  }

  sendMessage(threadId: string, content: string): void {
    if (!content.trim()) return;
    const newMsg: Message = {
      id: 'M' + Date.now(),
      senderId: 'teacher',
      senderName: 'You',
      content: content.trim(),
      timestamp: new Date().toLocaleDateString('en-CA'),
      isMine: true,
    };
    this.threads.update(threads => threads.map(t => {
      if (t.id !== threadId) return t;
      return {
        ...t,
        messages: [...t.messages, newMsg],
        lastMessagePreview: content,
        lastTimestamp: newMsg.timestamp,
      };
    }));
  }
}
