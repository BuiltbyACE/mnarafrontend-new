export interface DashboardData {
  teacherName: string;
  quickActions: QuickAction[];
  todayClasses: ClassInfo[];
  academicSnapshot: AcademicSnapshot;
  pendingGrading: PendingGradingItem[];
  studentAlerts: StudentAlert[];
  announcements: Announcement[];
  upcomingMeetings: Meeting[];
}

export interface QuickAction {
  label: string;
  icon: string;
  route?: string;
  action?: string;
}

export interface ClassInfo {
  id: string;
  subject: string;
  classroom: string;
  time: string;
  section: string;
}

export interface AcademicSnapshot {
  averagePerformance: number;
  assignmentCompletionRate: number;
  attendancePercentage: number;
}

export interface PendingGradingItem {
  id: string;
  title: string;
  subject: string;
  submittedCount: number;
  totalCount: number;
  dueDate: string;
}

export interface StudentAlert {
  id: string;
  studentName: string;
  type: 'academic' | 'attendance' | 'behavior';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  postedBy: string;
  postedAt: string;
  category?: string;
  pinned?: boolean;
  hasAttachments?: boolean;
  department?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  description?: string;
  organizer: string;
  location?: string;
  attendeeCount?: number;
  joinUrl?: string;
}

export interface Assignment {
  id: number;
  title: string;
  type: 'QUIZ' | 'ONLINE_TEXT' | 'FILE_UPLOAD' | 'PHYSICAL';
  assignment_category?: string;
  exam_code?: string;
  class: string;
  subject: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  max_score?: number;
  instructions?: string;
}

export interface CreateAssignmentPayload {
  title: string;
  instructions: string;
  submission_type: 'PHYSICAL' | 'ONLINE_TEXT' | 'FILE_UPLOAD' | 'QUIZ';
  assignment_category?: string;
  max_score: number;
  due_date: string;
  is_published: boolean;
  allow_immediate_review: boolean;
  course: number;
  questions?: QuizQuestionPayload[];
}

export interface QuizQuestionPayload {
  question_text: string;
  marks: number;
  options: { option_text: string; is_correct: boolean }[];
}

export interface CourseWorkspace {
  id: number;
  subject: string;
  class_name: string;
  section: string;
  student_count: number;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

export type ResourceType = 'DOCUMENT' | 'VIDEO' | 'LINK' | 'SLIDES' | 'TEXTBOOK' | 'COURSEBOOK' | 'PAST_PAPER';

export interface Resource {
  id: number;
  title: string;
  type: ResourceType;
  description?: string;
  subject: string;
  course: number;
  file_attachment?: string | null;
  file_size_mb?: number | null;
  external_url?: string | null;
  is_published: boolean;
  created_at: string;
}

export interface CreateResourcePayload {
  course: number;
  title: string;
  resource_type: ResourceType;
  description?: string;
  file_attachment?: File | null;
  external_url?: string;
  file_size_mb?: number;
}

export interface BehaviourRecord {
  id: number;
  student: string;
  studentId: string;
  type: 'COMMENDATION' | 'INCIDENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  date: string;
  status: 'OPEN' | 'RESOLVED' | 'FOLLOW_UP';
  reportedBy: string;
}

export interface MessageThread {
  id: number;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  subject: string;
}

export interface StudentProfile {
  id: number;
  name: string;
  studentId: string;
  class: string;
  attendance: number;
  performance: number;
  parentContact: string;
  avatar?: string;
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  gross: number;
  net: number;
  deductions: number;
  status: 'paid' | 'pending';
  downloadUrl?: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'CLASS' | 'MEETING' | 'EXAM' | 'EVENT' | 'DEADLINE';
  time?: string;
}

export interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SubmissionRecord {
  id: number;
  student: number;
  student_name: string;
  answers_payload: Record<string, unknown>;
  submission_text: string;
  uploaded_document: string | null;
  auto_grade_score: number;
  manual_grade_score: number;
  score_awarded: number;
  is_graded: boolean;
  is_late: boolean;
  is_draft: boolean;
  teacher_feedback: string;
  submitted_at: string | null;
  graded_at: string | null;
}

export interface SubmissionsResponse {
  assignment: {
    id: number;
    title: string;
    submission_type: string;
    max_score: number;
    deadline: string;
    status: string;
    enrolled_count: number;
    submitted_count: number;
    graded_count: number;
  };
  submissions: SubmissionRecord[];
  not_submitted: { id: number; full_name: string }[];
}

export interface UnreadCountResponse {
  count: number;
}

export interface TeacherProfile {
  name: string;
  employeeId: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  hireDate?: string;
  photoUrl?: string;
  surname?: string;
  otherNames?: string;
  nationalId?: string;
  kraPin?: string;
  qualificationLevel?: string;
  specializationArea?: string;
  tscNumber?: string;
  highestDegree?: string;
  teachingSubjects?: string[];
  leaveBalance?: { pointsRemaining: number };
}

export interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  appliedOn: string;
}

export interface CreateLeavePayload {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}
