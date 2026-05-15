import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AssignmentsService, AssignmentDTO, QuizQuestion } from '../../services/assignments.service';

type FilterKey = 'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED';

@Component({
  selector: 'app-assignment-quiz-dialog',
  imports: [MatCardModule, MatRadioModule, MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, FormsModule],
  template: `
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ assignment()?.title }}</h2>
        <p class="dialog-sub">{{ assignment()?.subject }}</p>
      </div>

      @if (questionsLoading()) {
        <div class="loading-state"><mat-spinner diameter="24" /><span>Loading questions...</span></div>
      } @else if (questionsError()) {
        <div class="error-state">
          <p>{{ questionsError() }}</p>
        </div>
      } @else {
        <div class="questions">
          @for (q of questions(); track q.id; let i = $index) {
            <mat-card class="question-card" appearance="outlined">
              <mat-card-content>
                <div class="question-head">
                  <p class="question-text">{{ i + 1 }}. {{ q.question_text }}</p>
                  <span class="marks-badge">{{ q.marks }} Marks</span>
                </div>
                <mat-radio-group [(ngModel)]="q.selectedAnswer" class="options-group">
                  @for (opt of q.options; track opt.id) {
                    <mat-radio-button [value]="opt.id" class="option">{{ opt.option_text }}</mat-radio-button>
                  }
                </mat-radio-group>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      @if (submitting()) {
        <div class="submitting-overlay"><mat-spinner diameter="20" /><span>Submitting...</span></div>
      }

      <div class="dialog-actions">
        <button mat-button (click)="cancel()" [disabled]="submitting()">Cancel</button>
        <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting() || questionsLoading()">Submit Answers</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog { padding: 24px; min-width: 600px; }
    .dialog-header { margin-bottom: 20px; }
    .dialog-header h2 { margin: 0; font-size: 1.3rem; font-weight: 700; color: #1e293b; }
    .dialog-sub { margin: 4px 0 0; color: #64748b; font-size: 0.9rem; }
    .questions { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
    .question-card { border: 1px solid #e2e8f0 !important; }
    .question-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .question-text { font-size: 0.95rem; font-weight: 600; color: #334155; margin: 0; flex: 1; }
    .marks-badge { font-size: 0.75rem; font-weight: 700; color: #6366f1; background: #ede9fe; padding: 2px 10px; border-radius: 12px; white-space: nowrap; margin-left: 12px; }
    .options-group { display: flex; flex-direction: column; gap: 8px; }
    .option { font-size: 0.9rem; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .loading-state, .error-state { display: flex; align-items: center; gap: 8px; padding: 24px; justify-content: center; color: #64748b; }
    .error-state p { color: #ef4444; margin: 0; }
    .submitting-overlay { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px; color: #6366f1; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentQuizDialogComponent {
  readonly assignment = signal<AssignmentDTO | null>(null);
  readonly questions = signal<QuizQuestion[]>([
    { id: 'q1', question_text: 'What is the value of x in 2x + 5 = 15?', marks: 2, options: [
      { id: 'q1_o1', option_text: '5' }, { id: 'q1_o2', option_text: '7' }, { id: 'q1_o3', option_text: '10' }, { id: 'q1_o4', option_text: '3' },
    ]},
    { id: 'q2', question_text: 'Factorize x² - 9', marks: 3, options: [
      { id: 'q2_o1', option_text: '(x-3)(x-3)' }, { id: 'q2_o2', option_text: '(x+3)(x-3)' }, { id: 'q2_o3', option_text: '(x+9)(x-1)' }, { id: 'q2_o4', option_text: 'x(x-9)' },
    ]},
    { id: 'q3', question_text: 'What is the slope of the line y = 3x + 2?', marks: 1, options: [
      { id: 'q3_o1', option_text: '2' }, { id: 'q3_o2', option_text: '3' }, { id: 'q3_o3', option_text: '-3' }, { id: 'q3_o4', option_text: '1/3' },
    ]},
    { id: 'q4', question_text: 'Solve: 5! = ?', marks: 2, options: [
      { id: 'q4_o1', option_text: '25' }, { id: 'q4_o2', option_text: '60' }, { id: 'q4_o3', option_text: '120' }, { id: 'q4_o4', option_text: '15' },
    ]},
  ]);
  readonly questionsLoading = signal(false);
  readonly questionsError = signal<string | null>(null);
  readonly submitting = signal(false);

  private dialog = inject(MatDialog);
  private service = inject(AssignmentsService);

  setAssignment(a: AssignmentDTO) {
    this.assignment.set(a);
    this.fetchQuestions(a.id);
  }

  private fetchQuestions(assignmentId: string): void {
    this.questionsLoading.set(true);
    this.questionsError.set(null);
    this.service.fetchQuizQuestions(assignmentId).subscribe({
      next: (qs) => { this.questions.set(qs); this.questionsLoading.set(false); },
      error: () => { this.questionsLoading.set(false); this.questionsError.set(null); },
    });
  }

  submit() {
    const a = this.assignment();
    if (!a) return;
    const answers = this.questions()
      .filter(q => q.selectedAnswer !== undefined)
      .map(q => ({ questionId: q.id, selectedAnswer: q.selectedAnswer! }));
    this.submitting.set(true);
    this.service.submitQuiz(a.id, answers).subscribe({
      next: () => {
        this.service.loadAssignments();
        this.dialog.closeAll();
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }

  cancel() { this.dialog.closeAll(); }
}

@Component({
  selector: 'app-assignment-upload-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule, FormsModule],
  template: `
    <div class="dialog">
      <h2>{{ assignment()?.title }}</h2>
      <p class="dialog-sub">{{ assignment()?.subject }}</p>
      <div class="drop-zone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)" (click)="fileInput.click()">
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        <p class="upload-text">Drag & drop your file here, or click to browse</p>
        <p class="upload-hint">Supported: PDF, DOC, DOCX, ZIP (max 25MB)</p>
        <input #fileInput type="file" hidden (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.zip" />
      </div>
      @if (selectedFile()) {
        <mat-card class="file-card" appearance="outlined">
          <mat-card-content>
            <mat-icon>description</mat-icon>
            <span class="file-name">{{ selectedFile()?.name }}</span>
            <span class="file-size">{{ (selectedFile()!.size / 1024 / 1024).toFixed(2) }} MB</span>
            <button mat-icon-button color="warn" (click)="clearFile()"><mat-icon>close</mat-icon></button>
          </mat-card-content>
        </mat-card>
      }
      @if (submitting()) {
        <div class="submitting-bar"><mat-spinner diameter="18" /><span>Uploading...</span></div>
      }
      <div class="dialog-actions">
        <button mat-button (click)="cancel()" [disabled]="submitting()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="!selectedFile() || submitting()" (click)="submit()">Submit File</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog { padding: 24px; min-width: 500px; }
    h2 { margin: 0; font-size: 1.3rem; font-weight: 700; color: #1e293b; }
    .dialog-sub { margin: 4px 0 20px; color: #64748b; }
    .drop-zone {
      border: 2px dashed #cbd5e1; border-radius: 12px; padding: 48px 24px;
      text-align: center; cursor: pointer; transition: all 0.2s; background: #f8fafc;
    }
    .drop-zone:hover { border-color: #3b82f6; background: #f0f7ff; }
    .upload-icon { font-size: 48px; width: 48px; height: 48px; color: #3b82f6; }
    .upload-text { font-size: 1rem; font-weight: 600; color: #334155; margin: 12px 0 4px; }
    .upload-hint { font-size: 0.8rem; color: #94a3b8; margin: 0; }
    .file-card { margin-top: 16px; }
    .file-card mat-card-content { display: flex; align-items: center; gap: 12px; padding: 12px 16px !important; }
    .file-name { flex: 1; font-weight: 500; color: #1e293b; }
    .file-size { color: #64748b; font-size: 0.8rem; }
    .submitting-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px; color: #6366f1; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentUploadDialogComponent {
  readonly assignment = signal<AssignmentDTO | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly submitting = signal(false);
  private dialog = inject(MatDialog);
  private service = inject(AssignmentsService);

  setAssignment(a: AssignmentDTO) { this.assignment.set(a); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) this.selectedFile.set(event.dataTransfer.files[0]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile.set(input.files[0]);
  }

  clearFile() { this.selectedFile.set(null); }

  submit() {
    const a = this.assignment();
    const file = this.selectedFile();
    if (!a || !file) return;
    this.submitting.set(true);
    this.service.submitFile(a.id, file).subscribe({
      next: () => {
        this.service.loadAssignments();
        this.dialog.closeAll();
      },
      error: () => { this.submitting.set(false); },
    });
  }

  cancel() { this.dialog.closeAll(); }
}

@Component({
  selector: 'app-assignment-text-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatCardModule, FormsModule],
  template: `
    <div class="dialog">
      <h2>{{ assignment()?.title }}</h2>
      <p class="dialog-sub">{{ assignment()?.subject }}</p>
      <p class="dialog-desc">{{ assignment()?.description }}</p>
      <mat-form-field appearance="outline" class="text-editor">
        <mat-label>Write your answer here...</mat-label>
        <textarea matInput rows="12" [(ngModel)]="textContent" placeholder="Type your response..."></textarea>
      </mat-form-field>
      <div class="text-footer"><span class="word-count">{{ wordCount() }} words</span></div>
      @if (submitting()) {
        <div class="submitting-bar"><mat-spinner diameter="18" /><span>Submitting...</span></div>
      }
      <div class="dialog-actions">
        <button mat-button (click)="cancel()" [disabled]="submitting()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="!textContent().trim() || submitting()" (click)="submit()">Submit</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog { padding: 24px; min-width: 650px; }
    h2 { margin: 0; font-size: 1.3rem; font-weight: 700; color: #1e293b; }
    .dialog-sub { margin: 4px 0 8px; color: #64748b; }
    .dialog-desc { color: #475569; font-size: 0.9rem; margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .text-editor { width: 100%; }
    .text-footer { display: flex; justify-content: flex-end; margin-top: 4px; }
    .word-count { font-size: 0.8rem; color: #94a3b8; }
    .submitting-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px; color: #6366f1; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentTextDialogComponent {
  readonly assignment = signal<AssignmentDTO | null>(null);
  readonly textContent = signal('');
  readonly submitting = signal(false);
  private dialog = inject(MatDialog);
  private service = inject(AssignmentsService);

  wordCount(): number {
    const c = this.textContent();
    return c.trim() ? c.trim().split(/\s+/).length : 0;
  }

  setAssignment(a: AssignmentDTO) { this.assignment.set(a); }

  submit() {
    const a = this.assignment();
    const text = this.textContent().trim();
    if (!a || !text) return;
    this.submitting.set(true);
    this.service.submitText(a.id, text).subscribe({
      next: () => {
        this.service.loadAssignments();
        this.dialog.closeAll();
      },
      error: () => { this.submitting.set(false); },
    });
  }

  cancel() { this.dialog.closeAll(); }
}

@Component({
  selector: 'app-assignments',
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, DatePipe, LowerCasePipe,
  ],
  template: `
    <div class="assignments-page">
      <div class="page-heading">
        <h2>Assignments</h2>
        <p>View and submit your assignments</p>
      </div>

      <div class="filter-bar">
        @for (f of filters; track f.key) {
          <button class="filter-chip" [class.active]="activeFilter() === f.key" (click)="activeFilter.set(f.key)">
            <mat-icon>{{ f.icon }}</mat-icon>
            {{ f.label }}
            @if (f.key === 'ALL') { <span class="chip-count">{{ service.assignments().length }}</span> }
          </button>
        }
      </div>

      @if (service.isLoading()) {
        <div class="loading-state"><mat-spinner diameter="36" /><p>Loading assignments...</p></div>
      } @else if (service.error(); as err) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>{{ err }}</p>
          <button mat-stroked-button color="primary" (click)="service.loadAssignments()">Retry</button>
        </div>
      } @else {
        <div class="assignments-grid">
          @for (a of filteredAssignments(); track a.id) {
            <mat-card class="assignment-card" appearance="outlined">
              <mat-card-content>
                <div class="card-top">
                  <mat-icon class="type-badge" [class]="a.submission_type">
                    {{ a.submission_type === 'QUIZ' ? 'quiz' : a.submission_type === 'FILE_UPLOAD' ? 'cloud_upload' : 'edit_note' }}
                  </mat-icon>
                  <span class="type-label">{{ typeLabel(a.submission_type) }}</span>
                </div>

                <h3 class="card-title">{{ a.title }}</h3>
                <p class="card-subject">{{ a.subject }}</p>
                <p class="card-desc">{{ a.description }}</p>

                <div class="card-meta">
                  <span class="due-label"><mat-icon>calendar_today</mat-icon>Due {{ a.due_date | date:'mediumDate' }}</span>
                  <span class="status-chip" [class]="a.status">{{ a.status }}</span>
                </div>

                @if (a.status === 'graded' && a.score_awarded != null && a.max_score != null) {
                  <div class="score-row">
                    <span class="score-value">Score: {{ a.score_awarded }} / {{ a.max_score }}</span>
                    <div class="score-track"><div class="score-fill" [style.width.%]="(a.score_awarded / a.max_score) * 100"></div></div>
                  </div>
                }
              </mat-card-content>

              <mat-card-actions>
                @if (a.status === 'pending' && a.submission_type === 'QUIZ') {
                  <button mat-raised-button color="primary" class="action-btn" (click)="openAssignment(a)">
                    <mat-icon>play_arrow</mat-icon> Start Quiz
                  </button>
                } @else if (a.status === 'pending' && a.submission_type === 'FILE_UPLOAD') {
                  <button mat-raised-button color="primary" class="action-btn" (click)="openAssignment(a)">
                    <mat-icon>cloud_upload</mat-icon> Upload File
                  </button>
                } @else if (a.status === 'pending' && a.submission_type === 'ONLINE_TEXT') {
                  <button mat-raised-button color="primary" class="action-btn" (click)="openAssignment(a)">
                    <mat-icon>edit</mat-icon> Write Answer
                  </button>
                } @else if (a.status === 'submitted') {
                  <button mat-stroked-button disabled class="action-btn">
                    <mat-icon>check_circle</mat-icon> Submitted
                  </button>
                } @else if (a.status === 'graded') {
                  <button mat-stroked-button disabled class="action-btn">
                    <mat-icon>grading</mat-icon> Graded
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon>assignment</mat-icon>
              <p>No {{ activeFilter() === 'ALL' ? '' : (activeFilter() | lowercase) }} assignments found</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .assignments-page { max-width: 1200px; }

    .page-heading { margin-bottom: 20px; }
    .page-heading h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #1e293b; }
    .page-heading p { margin: 4px 0 0; color: #64748b; }

    .filter-bar {
      display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
    }

    .filter-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px;
      background: #fff; color: #64748b; cursor: pointer;
      font-size: 0.85rem; font-weight: 500; transition: all 0.2s;
    }
    .filter-chip:hover { border-color: #6366f1; color: #6366f1; }
    .filter-chip.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .filter-chip mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .chip-count { font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 10px; }

    .loading-state, .error-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; min-height: 260px; color: #64748b;
    }
    .error-state mat-icon { font-size: 40px; width: 40px; height: 40px; color: #ef4444; }

    .assignments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .assignment-card {
      display: flex; flex-direction: column;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      transition: box-shadow 0.25s ease, transform 0.2s ease;
    }
    .assignment-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .assignment-card mat-card-content { flex: 1; padding: 20px !important; }
    .assignment-card mat-card-actions { padding: 12px 20px !important; }

    .card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }

    .type-badge {
      font-size: 18px; width: 18px; height: 18px; padding: 6px; border-radius: 8px;
    }
    .type-badge.QUIZ { color: #8b5cf6; background: #ede9fe; }
    .type-badge.FILE_UPLOAD { color: #10b981; background: #d1fae5; }
    .type-badge.ONLINE_TEXT { color: #f59e0b; background: #fef3c7; }

    .type-label {
      font-size: 0.7rem; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    .card-title { margin: 0 0 4px; font-size: 1.05rem; font-weight: 600; color: #1e293b; }
    .card-subject { margin: 0 0 8px; font-size: 0.8rem; color: #6366f1; font-weight: 500; }

    .card-desc {
      margin: 0 0 16px; font-size: 0.85rem; color: #64748b; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }

    .card-meta { display: flex; align-items: center; justify-content: space-between; }

    .due-label {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: #94a3b8;
    }
    .due-label mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .status-chip {
      font-size: 0.7rem; font-weight: 600; padding: 2px 10px; border-radius: 12px; text-transform: capitalize;
    }
    .status-chip.pending { background: #fef3c7; color: #92400e; }
    .status-chip.submitted { background: #dbeafe; color: #1e40af; }
    .status-chip.graded { background: #d1fae5; color: #065f46; }

    .score-row { margin-top: 12px; display: flex; align-items: center; gap: 8px; }
    .score-value { font-size: 0.85rem; font-weight: 700; color: #059669; white-space: nowrap; }
    .score-track { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .score-fill { height: 100%; background: #10b981; border-radius: 3px; transition: width 0.5s ease; }

    .action-btn { width: 100%; }
    .action-btn mat-icon { margin-right: 4px; }

    .empty-state {
      grid-column: 1 / -1; text-align: center; padding: 48px; color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .empty-state p { margin: 0; font-size: 1rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsComponent implements OnInit {
  readonly service = inject(AssignmentsService);
  readonly dialog = inject(MatDialog);

  readonly activeFilter = signal<FilterKey>('ALL');

  readonly filters: { key: FilterKey; label: string; icon: string }[] = [
    { key: 'ALL', label: 'All', icon: 'assignment' },
    { key: 'PENDING', label: 'Pending', icon: 'hourglass_empty' },
    { key: 'SUBMITTED', label: 'Submitted', icon: 'check_circle' },
    { key: 'GRADED', label: 'Graded', icon: 'grading' },
  ];

  readonly filteredAssignments = computed(() => {
    const all = this.service.assignments();
    const f = this.activeFilter().toLowerCase();
    return f === 'all' ? all : all.filter(a => a.status === f);
  });

  ngOnInit(): void {
    this.service.loadAssignments();
  }

  typeLabel(t: AssignmentDTO['submission_type']): string {
    switch (t) {
      case 'QUIZ': return 'Quiz';
      case 'FILE_UPLOAD': return 'File Upload';
      case 'ONLINE_TEXT': return 'Online Text';
    }
  }

  openAssignment(a: AssignmentDTO): void {
    switch (a.submission_type) {
      case 'QUIZ': {
        const ref = this.dialog.open(AssignmentQuizDialogComponent, { width: '700px' });
        ref.componentInstance.setAssignment(a);
        break;
      }
      case 'FILE_UPLOAD': {
        const ref = this.dialog.open(AssignmentUploadDialogComponent, { width: '600px' });
        ref.componentInstance.setAssignment(a);
        break;
      }
      case 'ONLINE_TEXT': {
        const ref = this.dialog.open(AssignmentTextDialogComponent, { width: '750px' });
        ref.componentInstance.setAssignment(a);
        break;
      }
    }
  }
}
