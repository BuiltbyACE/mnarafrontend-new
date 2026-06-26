import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TeacherAssignmentService } from '../../../core/services/teacher-assignment.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-view-assignment',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page" *ngIf="assignment() as assign; else loading">
      <div class="page-header">
        <div>
          <a class="back-link" [routerLink]="['/teacher/workspace', assign.course]">
            <mat-icon>arrow_back</mat-icon> Back to Workspace
          </a>
          <h1 class="page-title">{{ assign.title }}</h1>
          <p class="page-subtitle">
            <span class="type-badge">{{ assign.submission_type }}</span>
            <span class="status-badge" [class.published]="assign.is_published">{{ assign.is_published ? 'Published' : 'Draft' }}</span>
          </p>
        </div>
        <div class="header-actions">
          <a mat-button color="primary" [routerLink]="['/teacher/workspace', assign.course, 'assignments', assign.id, 'edit']">
            <mat-icon>edit</mat-icon> Edit Assignment
          </a>
        </div>
      </div>

      <div class="content-grid">
        <mat-card class="form-card main-info">
          <div class="form-section">
            <h2 class="section-title">Instructions</h2>
            <div class="rich-text-content" [innerHTML]="safeInstructions()"></div>
          </div>
        </mat-card>

        <mat-card class="form-card side-info">
          <div class="form-section">
            <h2 class="section-title">Details</h2>
            <div class="detail-row">
              <span class="detail-label">Due Date</span>
              <span class="detail-value">{{ assign.due_date | date:'mediumDate' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Max Score</span>
              <span class="detail-value">{{ assign.max_score }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Immediate Review</span>
              <span class="detail-value">{{ assign.allow_immediate_review ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </mat-card>
      </div>

      @if (assign.submission_type === 'QUIZ' && assign.questions && assign.questions.length > 0) {
        <mat-card class="form-card mt-6">
          <div class="form-section">
            <h2 class="section-title">Quiz Questions ({{ assign.questions.length }})</h2>
            
            <div class="questions-list">
              @for (q of assign.questions; track q.id; let qi = $index) {
                <div class="question-item">
                  <div class="q-header">
                    <span class="q-num">Q{{ qi + 1 }}</span>
                    <span class="q-marks">{{ q.marks }} mark(s)</span>
                  </div>
                  <p class="q-text">{{ q.question_text }}</p>
                  
                  <div class="options-list">
                    @for (opt of q.options; track opt.id) {
                      <div class="option-item" [class.correct]="opt.is_correct">
                        <mat-icon *ngIf="opt.is_correct" class="correct-icon">check_circle</mat-icon>
                        <mat-icon *ngIf="!opt.is_correct" class="incorrect-icon">radio_button_unchecked</mat-icon>
                        <span>{{ opt.option_text }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </mat-card>
      }
    </div>
    
    <ng-template #loading>
      <div class="page">
        <div class="loading-state">Loading assignment details...</div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      --p: #2563eb; --pl: #dbeafe; --pd: #1d4ed8;
      --s: #fff; --b: #f1f5f9; --t: #1e293b; --ts: #64748b; --bo: #e2e8f0;
      display: block; min-height: 100vh; background: var(--b); font-family: 'Inter', sans-serif; padding: 24px;
    }
    .page { max-width: 1000px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; color: var(--p); text-decoration: none; font-size: 13px; font-weight: 500; margin-bottom: 8px; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--t); margin: 0 0 8px 0; }
    .page-subtitle { display: flex; gap: 12px; align-items: center; margin: 0; }
    
    .type-badge { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: #475569; }
    .status-badge { background: #fef08a; color: #854d0e; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.published { background: #dcfce7; color: #166534; }
    
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .mt-6 { margin-top: 24px; }
    
    .form-card { border-radius: 12px; border: 1px solid var(--bo); padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .section-title { font-size: 1.1rem; font-weight: 600; color: var(--t); margin: 0 0 20px; padding-bottom: 8px; border-bottom: 1px solid var(--bo); }
    
    .rich-text-content { line-height: 1.6; color: var(--t); font-size: 0.95rem; }
    .rich-text-content ::ng-deep p { margin-bottom: 1em; }
    .rich-text-content ::ng-deep ul { list-style-type: disc; padding-left: 20px; margin-bottom: 1em; }
    .rich-text-content ::ng-deep ol { list-style-type: decimal; padding-left: 20px; margin-bottom: 1em; }
    
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: var(--ts); font-size: 0.875rem; font-weight: 500; }
    .detail-value { color: var(--t); font-size: 0.875rem; font-weight: 600; }
    
    .questions-list { display: flex; flex-direction: column; gap: 20px; }
    .question-item { border: 1px solid var(--bo); border-radius: 8px; padding: 16px; background: #f8fafc; }
    .q-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .q-num { font-weight: 700; color: var(--p); }
    .q-marks { font-size: 0.8125rem; font-weight: 600; color: var(--ts); background: var(--s); padding: 2px 8px; border-radius: 12px; border: 1px solid var(--bo); }
    .q-text { font-size: 1rem; color: var(--t); font-weight: 500; margin: 0 0 16px 0; }
    
    .options-list { display: flex; flex-direction: column; gap: 8px; }
    .option-item { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--s); border: 1px solid var(--bo); border-radius: 6px; font-size: 0.9rem; color: var(--ts); }
    .option-item.correct { border-color: #22c55e; color: #166534; background: #f0fdf4; font-weight: 500; }
    .correct-icon { color: #22c55e; font-size: 20px; width: 20px; height: 20px; }
    .incorrect-icon { color: #cbd5e1; font-size: 20px; width: 20px; height: 20px; }
    
    .loading-state { text-align: center; padding: 40px; color: var(--ts); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewAssignmentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(TeacherAssignmentService);
  private sanitizer = inject(DomSanitizer);

  readonly assignment = signal<any>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('aid') || this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.fetchAssignmentDetails(id).subscribe({
        next: (data) => this.assignment.set(data),
        error: (err) => console.error('Failed to fetch assignment details', err),
      });
    }
  }

  safeInstructions(): SafeHtml {
    const inst = this.assignment()?.instructions || '';
    return this.sanitizer.bypassSecurityTrustHtml(inst);
  }
}
