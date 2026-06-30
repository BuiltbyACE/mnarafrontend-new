import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormArray, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { QuillModule } from 'ngx-quill';
import { TeacherAssignmentService } from '../../../core/services/teacher-assignment.service';
import { WorkspacesService } from '../../classes/services/workspaces.service';
import type { CreateAssignmentPayload } from '../../../shared/models/teacher.models';

type SubmissionType = 'PHYSICAL' | 'ONLINE_TEXT' | 'FILE_UPLOAD' | 'QUIZ';

type OptionForm = FormGroup<{
  option_text: FormControl<string>;
  is_correct: FormControl<boolean>;
}>;

type QuestionForm = FormGroup<{
  question_text: FormControl<string>;
  marks: FormControl<number>;
  options: FormArray<OptionForm>;
}>;

type AssignmentForm = FormGroup<{
  title: FormControl<string>;
  instructions: FormControl<string>;
  submissionType: FormControl<SubmissionType>;
  maxScore: FormControl<number>;
  dueDate: FormControl<string>;
  courseWorkspace: FormControl<number | null>;
  isPublished: FormControl<boolean>;
  allowImmediateReview: FormControl<boolean>;
  questions: FormArray<QuestionForm>;
}>;

interface ApiOption {
  option_text: string;
  is_correct: boolean;
}

interface ApiQuestion {
  question_text: string;
  marks: string | number;
  options?: ApiOption[];
}

interface ApiAssignmentData {
  title: string;
  instructions: string;
  submission_type: SubmissionType;
  max_score: string | number;
  due_date: string | null;
  course: number;
  is_published: boolean;
  allow_immediate_review: boolean;
  questions?: ApiQuestion[];
}

@Component({
  selector: 'app-edit-assignment',
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatChipsModule, MatCheckboxModule, QuillModule,
  ],
  template: `
    @if (loaded()) {
      <div class="page">
        <div class="page-header">
          <div>
            <a class="back-link" [routerLink]="['/teacher/workspace', form.value.courseWorkspace]">
              <mat-icon>arrow_back</mat-icon> Back to Workspace
            </a>
            <h1 class="page-title">Edit Assignment</h1>
            <p class="page-subtitle">Update assignment details and settings</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="assignment-form">
          <mat-card class="form-card">
            <div class="form-section">
              <h2 class="section-title">Basic Information</h2>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Assignment Title</mat-label>
                <input matInput formControlName="title" placeholder="e.g. Algebra Quiz 1">
                @if (form.controls.title.invalid && form.controls.title.touched) {
                  <mat-error>Title is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Course / Class</mat-label>
                <mat-select formControlName="courseWorkspace">
                  @for (ws of workspaceService.workspaces(); track ws.id) {
                    <mat-option [value]="ws.id">{{ ws.subject_name }} — {{ ws.classroom_name }}</mat-option>
                  }
                </mat-select>
                @if (form.controls.courseWorkspace.invalid && form.controls.courseWorkspace.touched) {
                  <mat-error>Please select a class</mat-error>
                }
              </mat-form-field>

              <label class="field-label">Submission Type</label>
              <div class="type-chips">
                @for (t of submissionTypes; track t.value) {
                  <button type="button" class="type-chip {{ t.value.toLowerCase() }}" [class.active]="submissionTypeSig() === t.value" (click)="setSubmissionType(t.value)">
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
                  <input matInput type="number" formControlName="maxScore" min="1">
                  @if (form.controls.maxScore.invalid && form.controls.maxScore.touched) {
                    <mat-error>Enter a valid max score</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Due Date</mat-label>
                  <input matInput type="date" formControlName="dueDate">
                  @if (form.controls.dueDate.invalid && form.controls.dueDate.touched) {
                    <mat-error>Due date is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="toggle-row">
                <mat-slide-toggle formControlName="isPublished" color="primary">
                  Publish immediately
                </mat-slide-toggle>
                <span class="toggle-hint">Students will see the assignment right away</span>
              </div>

              @if (isQuiz()) {
                <div class="toggle-row">
                  <mat-slide-toggle formControlName="allowImmediateReview" color="primary">
                    Allow immediate review
                  </mat-slide-toggle>
                  <span class="toggle-hint">Students can see correct answers after submitting</span>
                </div>
              }
            </div>
          </mat-card>

          @if (!isQuiz()) {
            <mat-card class="form-card">
              <div class="form-section">
                <h2 class="section-title">
                  {{ isOnlineText() ? 'Assignment Prompt' : 'Assignment Description & Prompt' }}
                </h2>
                <p class="section-hint">
                  {{ isOnlineText() ? 'Type the prompt or question students need to answer online.' : 'Provide detailed instructions or the prompt for the assignment.' }}
                </p>
                
                <div class="quill-wrapper">
                  <quill-editor formControlName="instructions" 
                                theme="snow"
                                [modules]="quillModules"
                                [styles]="{height: '250px'}"
                                placeholder="Type the details here..."></quill-editor>
                </div>
              </div>
            </mat-card>
          }

          @if (isQuiz()) {
            <mat-card class="form-card" formArrayName="questions">
              <div class="form-section">
                <h2 class="section-title">Quiz Questions</h2>
                <p class="section-hint">Add questions and mark the correct option for each.</p>

                @for (q of questions.controls; track $index; let qi = $index) {
                  <mat-card class="question-card" appearance="outlined" [formGroupName]="qi">
                    <div class="question-header">
                      <span class="question-number">Question {{ qi + 1 }}</span>
                      <button type="button" class="remove-btn" (click)="removeQuestion(qi)" mat-icon-button>
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Question Text</mat-label>
                      <textarea matInput formControlName="question_text" rows="2"></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="marks-field">
                      <mat-label>Marks</mat-label>
                      <input matInput type="number" formControlName="marks" min="1">
                    </mat-form-field>

                    <div class="options-section" formArrayName="options">
                      <label class="options-label">Options</label>
                      @for (opt of getOptions(qi).controls; track $index; let oi = $index) {
                        <div class="option-row" [formGroupName]="oi">
                          <mat-checkbox
                            formControlName="is_correct"
                            (change)="setCorrectOption(qi, oi)"
                            color="primary"
                          ></mat-checkbox>
                          <mat-form-field appearance="outline" class="option-input">
                            <mat-label>Option {{ oi + 1 }}</mat-label>
                            <input matInput formControlName="option_text">
                          </mat-form-field>
                          @if (getOptions(qi).length > 2) {
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

          @if (service.error()) {
            <div class="error-banner">{{ service.error() }}</div>
          }

          <div class="form-actions">
            <button type="button" class="btn-cancel" [routerLink]="['/teacher/workspace', form.value.courseWorkspace]">Cancel</button>
            <button type="submit" class="btn-submit" [disabled]="form.invalid || service.isCreating()">
              @if (service.isCreating()) {
                Saving...
              } @else {
                <mat-icon>save</mat-icon> Save Changes
              }
            </button>
          </div>
        </form>
      </div>
    } @else {
      <div class="page">
        <div class="loading-state">Loading assignment details...</div>
      </div>
    }
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
    .type-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 100px; border: 1px solid var(--bo); background: var(--s); color: var(--ts); font-size: 0.8125rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; transition: all .15s; }
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
    .add-question-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: 1px dashed var(--bo); border-radius: 8px; background: var(--s); color: var(--p); font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; width: 100%; justify-content: center; transition: all .15s; }
    .add-question-btn:hover { border-color: var(--p); background: var(--pl); }
    .error-banner { padding: 12px 16px; background: #fee2e2; color: #991b1b; border-radius: 8px; font-size: 0.875rem; margin-top: 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; }
    .btn-cancel { padding: 10px 24px; border: 1px solid var(--bo); border-radius: 8px; background: var(--s); color: var(--ts); font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; text-decoration: none; }
    .btn-submit { display: inline-flex; align-items: center; gap: 6px; padding: 12px 28px; border: none; border-radius: 8px; background: var(--p); color: #fff; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s; }
    .btn-submit:hover { background: var(--pd); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .loading-state { text-align: center; padding: 40px; color: var(--ts); font-size: 1.1rem; }
  `]
})
export class EditAssignmentComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(NonNullableFormBuilder);
  readonly service = inject(TeacherAssignmentService);
  readonly workspaceService = inject(WorkspacesService);

  readonly submissionTypes = [
    { value: 'QUIZ', label: 'Quiz', icon: 'quiz' },
    { value: 'ONLINE_TEXT', label: 'Online Text', icon: 'text_fields' },
    { value: 'FILE_UPLOAD', label: 'File Upload', icon: 'upload_file' },
    { value: 'PHYSICAL', label: 'Physical', icon: 'description' },
  ] as const;

  assignmentId!: number;
  loaded = signal(false);

  form: AssignmentForm = this.fb.group({
    title: this.fb.control('', [Validators.required]),
    instructions: this.fb.control(''),
    submissionType: this.fb.control<SubmissionType>('ONLINE_TEXT', [Validators.required]),
    maxScore: this.fb.control(100, [Validators.required, Validators.min(1)]),
    dueDate: this.fb.control<string>('', [Validators.required]),
    courseWorkspace: this.fb.control<number | null>(null, [Validators.required]),
    isPublished: this.fb.control(true),
    allowImmediateReview: this.fb.control(false),
    questions: this.fb.array<QuestionForm>([]),
  });

  submissionTypeSig = signal<SubmissionType>('ONLINE_TEXT');
  isQuiz = computed(() => this.submissionTypeSig() === 'QUIZ');
  isOnlineText = computed(() => this.submissionTypeSig() === 'ONLINE_TEXT');

  readonly quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean'],
    ]
  };

  get questions(): FormArray<QuestionForm> {
    return this.form.controls.questions;
  }

  getOptions(qIndex: number): FormArray<OptionForm> {
    return this.questions.at(qIndex).controls.options;
  }

  ngOnInit() {
    this.form.controls.submissionType.valueChanges.subscribe(val => {
      if (val) this.submissionTypeSig.set(val);
    });

    if (this.workspaceService.workspaces().length === 0) {
      this.workspaceService.fetchMyWorkspaces().subscribe({
        next: ws => {
          this.workspaceService.workspaces.set(ws);
          this.cdr.markForCheck();
        },
        error: err => console.error('Error fetching workspaces:', err)
      });
    }

    const idParam = this.route.snapshot.paramMap.get('aid') || this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.assignmentId = Number(idParam);
      this.service.fetchAssignmentDetails(this.assignmentId).subscribe({
        next: (response: unknown) => {
          const data = response as ApiAssignmentData;
          
          this.submissionTypeSig.set(data.submission_type);
          
          this.form.patchValue({
            title: data.title,
            instructions: data.instructions || '',
            submissionType: data.submission_type,
            maxScore: Number(data.max_score),
            dueDate: data.due_date || '',
            courseWorkspace: data.course,
            isPublished: data.is_published,
            allowImmediateReview: data.allow_immediate_review,
          });

          if (data.questions && data.questions.length > 0) {
            data.questions.forEach(q => {
              const qForm = this.fb.group({
                question_text: this.fb.control(q.question_text, [Validators.required]),
                marks: this.fb.control(Number(q.marks), [Validators.required, Validators.min(1)]),
                options: this.fb.array<OptionForm>([])
              });
              
              (q.options || []).forEach(o => {
                qForm.controls.options.push(this.fb.group({
                  option_text: this.fb.control(o.option_text, [Validators.required]),
                  is_correct: this.fb.control(o.is_correct)
                }));
              });
              
              this.questions.push(qForm);
            });
          }

          this.loaded.set(true);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Failed to load assignment', err)
      });
    }
  }

  setSubmissionType(type: SubmissionType): void {
    this.form.controls.submissionType.setValue(type);
  }

  addQuestion(): void {
    const qForm = this.fb.group({
      question_text: this.fb.control('', [Validators.required]),
      marks: this.fb.control(1, [Validators.required, Validators.min(1)]),
      options: this.fb.array<OptionForm>([
        this.fb.group({ option_text: this.fb.control('', [Validators.required]), is_correct: this.fb.control(false) }),
        this.fb.group({ option_text: this.fb.control('', [Validators.required]), is_correct: this.fb.control(false) })
      ])
    });
    this.questions.push(qForm);
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  addOption(qIndex: number): void {
    const opts = this.getOptions(qIndex);
    opts.push(this.fb.group({
      option_text: this.fb.control('', [Validators.required]),
      is_correct: this.fb.control(false)
    }));
  }

  removeOption(qIndex: number, oIndex: number): void {
    const opts = this.getOptions(qIndex);
    opts.removeAt(oIndex);
  }

  setCorrectOption(qIndex: number, selectedOIndex: number): void {
    const opts = this.getOptions(qIndex);
    opts.controls.forEach((optCtrl, index) => {
      optCtrl.controls.is_correct.setValue(index === selectedOIndex);
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    
    const val = this.form.getRawValue();
    if (!val.courseWorkspace || !val.dueDate) return;

    const payload: Partial<CreateAssignmentPayload> = {
      title: val.title,
      instructions: val.instructions,
      submission_type: val.submissionType,
      max_score: val.maxScore,
      due_date: val.dueDate,
      is_published: val.isPublished,
      allow_immediate_review: val.allowImmediateReview,
      course: val.courseWorkspace,
    };

    if (val.submissionType === 'QUIZ' && val.questions.length > 0) {
      payload.questions = val.questions.map(q => ({
        question_text: q.question_text,
        marks: q.marks,
        options: q.options.map(o => ({ option_text: o.option_text, is_correct: o.is_correct })),
      }));
    }

    this.service.updateAssignment(this.assignmentId, payload).subscribe({
      next: () => {
        this.router.navigate(['/teacher/workspace', val.courseWorkspace]);
      },
      error: (err) => console.error('Failed to update assignment', err)
    });
  }
}
