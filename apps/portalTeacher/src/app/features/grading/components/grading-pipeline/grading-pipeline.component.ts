import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { GradingPipelineService, GradingStatus, PipelineSubmission } from '../../services/grading-pipeline.service';
import { TeacherAssignmentService } from '../../../../core/services/teacher-assignment.service';

const COLUMN_STATUS: Record<string, GradingStatus> = {
  'col-submitted': 'SUBMITTED',
  'col-in-review': 'IN_REVIEW',
  'col-graded':    'GRADED',
};

const AVATAR_PALETTE = [
  '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#c026d3',
];

@Component({
  selector: 'app-grading-pipeline',
  standalone: true,
  imports: [DragDropModule, DatePipe, NgTemplateOutlet, MatIconModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './grading-pipeline.component.html',
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&display=swap');

    :host {
      --primary:       #6366f1;
      --primary-dark:  #4f46e5;
      --primary-light: #eef2ff;
      --secondary:     #818cf8;
      --bg:            #f5f3ff;
      --surface:       #ffffff;
      --bo:            #e0e7ff;
      --t:             #1e1b4b;
      --ts:            #6366f1;
      --ts-muted:      #6b7280;
      --success:       #10b981;
      --success-bg:    #d1fae5;
      --success-text:  #065f46;
      --warning-bg:    #fef3c7;
      --warning-text:  #92400e;
      --error-bg:      #fee2e2;
      --error-text:    #991b1b;
      display: block;
      font-family: 'Fira Sans', 'Inter', 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      min-height: 100vh;
      padding: 28px 32px;
    }

    /* ── page ── */
    .page { max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-title {
      font-size: 1.625rem; font-weight: 700; margin: 0 0 4px;
      background: linear-gradient(135deg, var(--t) 0%, var(--primary) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .page-sub { font-size: 0.875rem; color: var(--ts-muted); margin: 0; }

    /* ── picker row ── */
    .picker-row {
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
      background: var(--surface); border: 1px solid var(--bo); border-radius: 14px;
      padding: 14px 20px; margin-bottom: 24px;
      box-shadow: 0 1px 4px 0 rgb(99 102 241 / 0.08);
    }
    .picker-label { font-size: 0.875rem; font-weight: 600; color: var(--t); white-space: nowrap; }
    .picker-field { flex: 1; max-width: 440px; }
    .total-chips { display: flex; gap: 10px; margin-left: auto; flex-wrap: wrap; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 8px; font-size: 0.8125rem; font-weight: 600;
      transition: opacity 200ms ease;
    }
    .chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .chip.submitted { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .chip.in-review { background: var(--warning-bg); color: var(--warning-text); border: 1px solid #fde68a; }
    .chip.graded    { background: var(--success-bg); color: var(--success-text); border: 1px solid #a7f3d0; }

    /* ── empty prompt ── */
    .pick-prompt {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 380px; gap: 14px; color: var(--ts-muted);
    }
    .pick-prompt mat-icon {
      font-size: 64px; width: 64px; height: 64px;
      color: var(--secondary); opacity: 0.35;
    }
    .pick-prompt h3 { font-size: 1.125rem; font-weight: 700; color: var(--t); margin: 0; }
    .pick-prompt p  { font-size: 0.9rem; color: var(--ts-muted); margin: 0; }

    /* ── toast (error) ── */
    .toast {
      display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
      padding: 12px 16px; border-radius: 10px; border: 1px solid #fecaca;
      background: var(--error-bg); color: var(--error-text);
      font-size: 0.875rem; font-weight: 500;
    }
    .toast mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .toast-close {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: var(--error-text); padding: 0; line-height: 1;
    }
    .toast-close:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 4px; }

    /* ── board ── */
    .board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; align-items: start; }

    /* ── column ── */
    .column {
      background: #fafafa; border: 1px solid var(--bo); border-radius: 16px;
      padding: 16px; min-height: 520px; display: flex; flex-direction: column;
    }
    .col-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--bo);
    }
    .col-title {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--ts-muted);
    }
    .col-count { font-size: 0.75rem; font-weight: 700; padding: 2px 10px; border-radius: 100px; }
    .col-count.submitted { background: #e0e7ff; color: #3730a3; }
    .col-count.in_review { background: var(--warning-bg); color: var(--warning-text); }
    .col-count.graded    { background: var(--success-bg); color: var(--success-text); }

    /* ── drop list ── */
    .drop-list { flex: 1; display: flex; flex-direction: column; gap: 10px; min-height: 120px; }
    .cdk-drop-list-dragging .kanban-card:not(.cdk-drag-placeholder) {
      transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drag-placeholder {
      border: 2px dashed var(--secondary); border-radius: 12px;
      background: var(--primary-light); min-height: 100px; opacity: 0.6;
    }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
    .empty-drop {
      flex: 1; display: flex; align-items: center; justify-content: center;
      min-height: 80px; border: 2px dashed #c7d2fe; border-radius: 10px;
      color: #a5b4fc; font-size: 0.8125rem; text-align: center;
    }

    /* ── loading / error ── */
    .loading-row {
      display: flex; justify-content: center; align-items: center; gap: 10px;
      padding: 60px; color: var(--ts-muted);
    }
    .loading-row mat-icon { color: var(--primary); animation: spin 1.2s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .error-banner {
      padding: 12px 20px; background: var(--error-bg); color: var(--error-text);
      border-radius: 10px; font-size: 0.875rem; margin-bottom: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradingPipelineComponent implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  readonly pipeline      = inject(GradingPipelineService);
  readonly assignmentSvc = inject(TeacherAssignmentService);

  readonly selectedId    = signal<number | null>(null);
  readonly submittedList = signal<PipelineSubmission[]>([]);
  readonly inReviewList  = signal<PipelineSubmission[]>([]);
  readonly gradedList    = signal<PipelineSubmission[]>([]);

  readonly assignments = this.assignmentSvc.assignments;

  readonly selectedLabel = computed(() => {
    const id = this.selectedId();
    return id ? (this.assignments().find(a => a.id === id)?.title ?? '') : '';
  });

  constructor() {
    effect(() => {
      this.submittedList.set([...this.pipeline.submitted()]);
      this.inReviewList.set([...this.pipeline.inReview()]);
      this.gradedList.set([...this.pipeline.graded()]);
    });
  }

  ngOnInit(): void {
    this.assignmentSvc.fetchAssignments();
    const routeId = Number(this.route.snapshot.paramMap.get('id')) || null;
    if (routeId) {
      this.selectedId.set(routeId);
      this.pipeline.fetchPipeline(routeId);
    } else {
      this.pipeline.submissions.set([]);
    }
  }

  onAssignmentChange(id: number): void {
    this.selectedId.set(id);
    this.pipeline.submissions.set([]);
    this.pipeline.fetchPipeline(id);
  }

  drop(event: CdkDragDrop<PipelineSubmission[]>): void {
    if (event.previousContainer === event.container) return;
    const item      = event.previousContainer.data[event.previousIndex];
    const newStatus = COLUMN_STATUS[event.container.id];
    if (!newStatus || !item) return;

    const prevData = [...event.previousContainer.data];
    const nextData = [...event.container.data];
    transferArrayItem(prevData, nextData, event.previousIndex, event.currentIndex);
    this.setColumn(event.previousContainer.id, prevData);
    this.setColumn(event.container.id, nextData);
    this.pipeline.updateGradingStatus(item.id, newStatus);
  }

  gradeNow(event: Event, item: PipelineSubmission): void {
    event.stopPropagation();
    const assignmentId = this.selectedId();
    if (assignmentId) {
      this.router.navigate(['/teacher/assignments', assignmentId, 'submissions']);
    }
  }

  dismissPatchError(): void {
    this.pipeline.patchError.set(null);
  }

  /** Derive up to 2 uppercase initials from a full name. */
  initials(name: string): string {
    return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase();
  }

  /** Deterministic avatar colour derived from the student's name. */
  avatarColor(name: string): string {
    let h = 0;
    for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
    return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
  }

  private setColumn(colId: string, items: PipelineSubmission[]): void {
    if (colId === 'col-submitted') this.submittedList.set(items);
    else if (colId === 'col-in-review') this.inReviewList.set(items);
    else if (colId === 'col-graded')    this.gradedList.set(items);
  }
}
