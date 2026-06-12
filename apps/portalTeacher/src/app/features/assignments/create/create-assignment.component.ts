import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { QuillModule } from 'ngx-quill';
import { TeacherAssignmentService } from '../../../core/services/teacher-assignment.service';
import { WorkspacesService } from '../../classes/services/workspaces.service';
import type { CreateAssignmentPayload, QuizQuestionPayload } from '../../../shared/models/teacher.models';

@Component({
  selector: 'app-create-assignment',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    MatCardModule, MatInputModule, MatFormFieldModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatChipsModule, MatCheckboxModule, QuillModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a class="back-link" [routerLink]="['/teacher/workspace', courseWorkspace]">
            <mat-icon>arrow_back</mat-icon> Back to Workspace
          </a>
          <h1 class="page-title">Create Assignment</h1>
          <p class="page-subtitle">Set up a new assignment for your class</p>
        </div>
      </div>

      <form #f="ngForm" (ngSubmit)="onSubmit()" class="assignment-form">
        <mat-card class="form-card">
          <div class="form-section">
            <h2 class="section-title">Basic Information</h2>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Assignment Title</mat-label>
              <input matInput [(ngModel)]="title" name="title" required #titleModel="ngModel" placeholder="e.g. Algebra Quiz 1">
              @if (titleModel.invalid && titleModel.touched) {
                <mat-error>Title is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Course / Class</mat-label>
              <mat-select [(ngModel)]="courseWorkspace" name="courseWorkspace" required #courseModel="ngModel">
                @for (ws of workspaceService.workspaces(); track ws.id) {
                  <mat-option [value]="ws.id">{{ ws.subject_name }} — {{ ws.classroom_name }}</mat-option>
                }
              </mat-select>
              @if (courseModel.invalid && courseModel.touched) {
                <mat-error>Please select a class</mat-error>
              }
            </mat-form-field>

            <label class="field-label">Submission Type</label>
            <div class="type-chips">
              @for (t of submissionTypes; track t.value) {
                <button type="button" class="type-chip {{ t.value.toLowerCase() }}" [class.active]="submissionType() === t.value" (click)="submissionType.set(t.value)">
                  <mat-icon>{{ t.icon }}</mat-icon>
                  {{ t.label }}
                </button>
              }
            </div>

          </div>
        </mat-card>

        <mat-card class="form-card">
          <div class="form-section">
            <h2 class="section-title">Grading & Schedule</h2>

            <div class="row-fields">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Max Score</mat-label>
                <input matInput type="number" [(ngModel)]="maxScore" name="maxScore" required min="1" #scoreModel="ngModel">
                @if (scoreModel.invalid && scoreModel.touched) {
                  <mat-error>Enter a valid max score</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Due Date</mat-label>
                <input matInput [matDatepicker]="picker" [(ngModel)]="dueDate" name="dueDate" required #dateModel="ngModel">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (dateModel.invalid && dateModel.touched) {
                  <mat-error>Due date is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="toggle-row">
              <mat-slide-toggle [(ngModel)]="isPublished" name="isPublished" color="primary">
                Publish immediately
              </mat-slide-toggle>
              <span class="toggle-hint">Students will see the assignment right away</span>
            </div>

            @if (submissionType() === 'QUIZ') {
              <div class="toggle-row">
                <mat-slide-toggle [(ngModel)]="allowImmediateReview" name="allowImmediateReview" color="primary">
                  Allow immediate review
                </mat-slide-toggle>
                <span class="toggle-hint">Students can see correct answers after submitting</span>
              </div>
            }
          </div>
        </mat-card>

        @if (submissionType() !== 'QUIZ') {
          <mat-card class="form-card">
            <div class="form-section">
              <h2 class="section-title">
                {{ submissionType() === 'ONLINE_TEXT' ? 'Assignment Prompt' : 'Assignment Description & Prompt' }}
              </h2>
              <p class="section-hint">
                {{ submissionType() === 'ONLINE_TEXT' ? 'Type the prompt or question students need to answer online.' : 'Provide detailed instructions or the prompt for the assignment.' }}
              </p>
              
              <div class="quill-wrapper">
                <quill-editor [(ngModel)]="instructions" name="instructions" 
                              theme="snow"
                              [modules]="quillModules"
                              [styles]="{height: '250px'}"
                              placeholder="Type the details here..."></quill-editor>
              </div>
            </div>
          </mat-card>
        }

        @if (submissionType() === 'QUIZ') {
          <mat-card class="form-card">
            <div class="form-section">
              <h2 class="section-title">Quiz Questions</h2>
              <p class="section-hint">Add questions and mark the correct option for each.</p>

              @for (q of quizQuestions; track q._uid; let qi = $index) {
                <mat-card class="question-card" appearance="outlined">
                  <div class="question-header">
                    <span class="question-number">Question {{ qi + 1 }}</span>
                    <button type="button" class="remove-btn" (click)="removeQuestion(qi)" mat-icon-button>
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Question Text</mat-label>
                    <textarea matInput [(ngModel)]="q.question_text" [name]="'q_text_' + qi" rows="2" required></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="marks-field">
                    <mat-label>Marks</mat-label>
                    <input matInput type="number" [(ngModel)]="q.marks" [name]="'q_marks_' + qi" min="1" required>
                  </mat-form-field>

                  <div class="options-section">
                    <label class="options-label">Options</label>
                    @for (opt of q.options; track $index; let oi = $index) {
                      <div class="option-row">
                        <mat-checkbox
                          [checked]="opt.is_correct"
                          (change)="setCorrectOption(qi, oi)"
                          color="primary"
                        ></mat-checkbox>
                        <mat-form-field appearance="outline" class="option-input">
                          <mat-label>Option {{ oi + 1 }}</mat-label>
                          <input matInput [(ngModel)]="opt.option_text" [name]="'q_' + qi + '_opt_' + oi" required>
                        </mat-form-field>
                        @if (q.options.length > 2) {
                          <button type="button" class="remove-option-btn" (click)="removeOption(qi, oi)" mat-icon-button>
                            <mat-icon>remove_circle</mat-icon>
                          </button>
                        }
                      </div>
                    }
                    <button type="button" class="add-option-btn" (click)="addOption(qi)">
                      <mat-icon>add</mat-icon> Add Option
                    </button>
                  </div>
                </mat-card>
              }

              <button type="button" class="add-question-btn" (click)="addQuestion()">
                <mat-icon>add_circle</mat-icon> Add Question
              </button>
            </div>
          </mat-card>
        }

          @if (service.error(); as err) {
            <div class="error-banner">{{ err }}</div>
          }

        <div class="form-actions">
          <button type="button" class="btn-cancel" [routerLink]="['/teacher/workspace', courseWorkspace]">Cancel</button>
          <button type="submit" class="btn-submit" [disabled]="f.invalid || service.isCreating()">
            @if (service.isCreating()) {
              Creating...
            } @else {
              <mat-icon>check</mat-icon> Create Assignment
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      --p: #2563eb; --pl: #dbeafe; --pd: #1d4ed8;
      --s: #fff; --b: #f1f5f9; --t: #1e293b; --ts: #64748b; --bo: #e2e8f0;
      display: block; min-height: 100vh; background: var(--b); font-family: 'Inter', sans-serif; padding: 24px;
    }
    .page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; color: var(--p); text-decoration: none; font-size: 13px; font-weight: 500; margin-bottom: 8px; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--t); margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: var(--ts); margin: 4px 0 0; }
    .assignment-form { display: flex; flex-direction: column; gap: 24px; }
    .form-card { border-radius: 12px; border: 1px solid var(--bo); padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .form-section {}
    .section-title { font-size: 1.1rem; font-weight: 600; color: var(--t); margin: 0 0 20px; padding-bottom: 8px; border-bottom: 1px solid var(--bo); }
    .section-hint { font-size: 0.8125rem; color: var(--ts); margin: -12px 0 16px; }
    .full-width { width: 100%; }
    .half-width { width: 100%; }
    .row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field-label { font-size: 0.8125rem; font-weight: 500; color: var(--t); display: block; margin-bottom: 8px; }
    .quill-wrapper { margin-bottom: 24px; border: 1px solid var(--bo); border-radius: 8px; background: #fff; }
    quill-editor { display: block; min-height: 250px; width: 100%; }
    ::ng-deep .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid var(--bo); border-top-left-radius: 8px; border-top-right-radius: 8px; background: #f8fafc; font-family: 'Inter', sans-serif; padding: 10px 12px; }
    ::ng-deep .ql-container.ql-snow { border: none; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.95rem; min-height: 250px; background: #fff; }
    ::ng-deep .ql-editor { min-height: 300px; padding: 24px 28px; line-height: 1.6; color: var(--t); }
    ::ng-deep .ql-editor.ql-blank::before { font-style: normal; color: var(--ts); font-size: 0.95rem; }
    .type-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .type-chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 100px;
      border: 1px solid var(--bo); background: var(--s); color: var(--ts); font-size: 0.8125rem;
      font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; transition: all .15s;
    }
    .type-chip:hover { border-color: var(--p); color: var(--p); }
    .type-chip.active { background: var(--pl); border-color: var(--p); color: var(--pd); }
    .type-chip mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .toggle-row { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
    .toggle-hint { font-size: 0.75rem; color: var(--ts); margin-left: 48px; }

    .question-card { padding: 16px; margin-bottom: 16px; border: 1px solid var(--bo); border-radius: 8px; }
    .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .question-number { font-size: 0.875rem; font-weight: 600; color: var(--p); }
    .remove-btn { color: #ef4444; }
    .marks-field { width: 120px; margin-bottom: 12px; }
    .options-section { margin-top: 8px; }
    .options-label { font-size: 0.75rem; font-weight: 600; color: var(--ts); text-transform: uppercase; letter-spacing: .05em; display: block; margin-bottom: 8px; }
    .option-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .option-input { flex: 1; }
    .remove-option-btn { color: #ef4444; }
    .add-option-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8125rem; color: var(--p); background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; padding: 4px 0; }
    .add-option-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .add-question-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: 1px dashed var(--bo); border-radius: 8px; background: var(--s); color: var(--p); font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; width: 100%; justify-content: center; transition: all .15s; }
    .add-question-btn:hover { border-color: var(--p); background: var(--pl); }
    .error-banner { padding: 12px 16px; background: #fee2e2; color: #991b1b; border-radius: 8px; font-size: 0.875rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; }
    .btn-cancel { padding: 10px 24px; border: 1px solid var(--bo); border-radius: 8px; background: var(--s); color: var(--ts); font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; text-decoration: none; }
    .btn-submit { display: inline-flex; align-items: center; gap: 6px; padding: 12px 28px; border: none; border-radius: 8px; background: var(--p); color: #fff; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s; }
    .btn-submit:hover { background: var(--pd); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .btn-submit mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .btn-submit mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAssignmentComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly service = inject(TeacherAssignmentService);
  readonly workspaceService = inject(WorkspacesService);

  readonly submissionTypes = [
    { value: 'QUIZ', label: 'Quiz', icon: 'quiz' },
    { value: 'ONLINE_TEXT', label: 'Online Text', icon: 'text_fields' },
    { value: 'FILE_UPLOAD', label: 'File Upload', icon: 'upload_file' },
    { value: 'PHYSICAL', label: 'Physical', icon: 'description' },
  ] as const;

  title = '';
  instructions = '';
  submissionType = signal<'PHYSICAL' | 'ONLINE_TEXT' | 'FILE_UPLOAD' | 'QUIZ'>('ONLINE_TEXT');
  maxScore = 100;
  dueDate: Date | null = null;
  courseWorkspace: number | null = null;
  isPublished = true;
  allowImmediateReview = false;

  readonly quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean'],
    ]
  };

  quizQuestions: (QuizQuestionPayload & { _uid: number })[] = [];

  private nextUid = 1;

  constructor() {
    if (this.workspaceService.workspaces().length === 0) {
      this.workspaceService.fetchMyWorkspaces().subscribe({
        next: ws => this.workspaceService.workspaces.set(ws),
        error: err => console.error('Error fetching workspaces:', err)
      });
    }
    const wsId = this.route.snapshot.paramMap.get('id');
    if (wsId) {
      this.courseWorkspace = Number(wsId);
    }
  }

  addQuestion(): void {
    this.quizQuestions = [...this.quizQuestions, {
      _uid: this.nextUid++,
      question_text: '',
      marks: 1,
      options: [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ],
    }];
  }

  removeQuestion(index: number): void {
    this.quizQuestions = this.quizQuestions.filter((_, i) => i !== index);
  }

  addOption(qIndex: number): void {
    const q = this.quizQuestions[qIndex];
    q.options = [...q.options, { option_text: '', is_correct: false }];
    this.quizQuestions = [...this.quizQuestions];
  }

  removeOption(qIndex: number, oIndex: number): void {
    const q = this.quizQuestions[qIndex];
    q.options = q.options.filter((_, i) => i !== oIndex);
    this.quizQuestions = [...this.quizQuestions];
  }

  setCorrectOption(qIndex: number, oIndex: number): void {
    const q = this.quizQuestions[qIndex];
    q.options = q.options.map((opt, i) => ({ ...opt, is_correct: i === oIndex }));
    this.quizQuestions = [...this.quizQuestions];
  }

  onSubmit(): void {
    if (!this.title || !this.courseWorkspace || !this.dueDate) return;

    const payload: CreateAssignmentPayload = {
      title: this.title,
      instructions: this.instructions,
      submission_type: this.submissionType(),
      max_score: this.maxScore,
      due_date: this.dueDate.toISOString().split('T')[0],
      is_published: this.isPublished,
      allow_immediate_review: this.allowImmediateReview,
      course: this.courseWorkspace,
    };

    if (this.submissionType() === 'QUIZ' && this.quizQuestions.length > 0) {
      payload.questions = this.quizQuestions.map(q => ({
        question_text: q.question_text,
        marks: q.marks,
        options: q.options.map(o => ({ option_text: o.option_text, is_correct: o.is_correct })),
      }));
    }

    this.service.createAssignment(payload);
    this.router.navigate(['/teacher/workspace', payload.course]);
  }
}
