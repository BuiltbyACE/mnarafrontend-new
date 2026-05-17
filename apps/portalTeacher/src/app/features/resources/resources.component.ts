import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Resource } from '../../shared/models/teacher.models';

@Component({
  selector: 'app-teacher-resources',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Lesson Resources</h1>
          <p class="page-subtitle">Upload and manage teaching materials</p>
        </div>
        <button class="btn-primary" (click)="uploadResource()">
          <mat-icon>cloud_upload</mat-icon>
          Upload Resource
        </button>
      </div>

      <mat-card class="search-card">
        <div class="search-row">
          <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Search resources..." [value]="searchQuery()" (input)="searchQuery.set($any($event.target).value)">
          </mat-form-field>
          <mat-form-field appearance="outline" class="subject-field" subscriptSizing="dynamic">
            <mat-label>Subject</mat-label>
            <mat-select [value]="subjectFilter()" (selectionChange)="subjectFilter.set($event.value)">
              <mat-option value="All">All Subjects</mat-option>
              <mat-option value="Mathematics">Mathematics</mat-option>
              <mat-option value="Physics">Physics</mat-option>
              <mat-option value="Chemistry">Chemistry</mat-option>
              <mat-option value="Biology">Biology</mat-option>
              <mat-option value="English">English</mat-option>
              <mat-option value="History">History</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <div class="results-info">
        <span>{{ filteredResources().length }} resource{{ filteredResources().length !== 1 ? 's' : '' }} found</span>
      </div>

      <div class="resource-grid">
        @for (r of filteredResources(); track r.id) {
        <mat-card class="resource-card">
          <div class="resource-icon-area">
            <div class="resource-icon" [class.icon-notes]="r.type === 'NOTES'"
                 [class.icon-video]="r.type === 'VIDEO'"
                 [class.icon-worksheet]="r.type === 'WORKSHEET'"
                 [class.icon-past-paper]="r.type === 'PAST_PAPER'"
                 [class.icon-coursebook]="r.type === 'COURSEBOOK'">
              <mat-icon>{{ typeIcon(r.type) }}</mat-icon>
            </div>
          </div>
          <div class="resource-body">
            <div class="resource-header">
              <h3 class="resource-title">{{ r.title }}</h3>
              <span class="type-badge"
                    [class.type-notes]="r.type === 'NOTES'"
                    [class.type-video]="r.type === 'VIDEO'"
                    [class.type-worksheet]="r.type === 'WORKSHEET'"
                    [class.type-past-paper]="r.type === 'PAST_PAPER'"
                    [class.type-coursebook]="r.type === 'COURSEBOOK'">
                {{ typeLabel(r.type) }}
              </span>
            </div>
            <div class="resource-meta">
              <span class="meta-item">
                <mat-icon>book</mat-icon>
                {{ r.subject }}
              </span>
              <span class="meta-item">
                <mat-icon>calendar_today</mat-icon>
                {{ r.uploadedAt | date:'MMM d, y' }}
              </span>
              @if (r.fileSize) {
              <span class="meta-item">
                <mat-icon>storage</mat-icon>
                {{ r.fileSize }}
              </span>
              }
            </div>
            <div class="resource-actions">
              <button class="btn-download" (click)="downloadResource(r)">
                <mat-icon>download</mat-icon>
                Download
              </button>
              <button class="btn-icon" (click)="previewResource(r)">
                <mat-icon>visibility</mat-icon>
              </button>
              <button class="btn-icon" (click)="shareResource(r)">
                <mat-icon>share</mat-icon>
              </button>
            </div>
          </div>
          </mat-card>
        }
        </div>
        @if (filteredResources().length === 0) {
        <div class="empty-state">
        <mat-icon class="empty-icon">folder_open</mat-icon>
        <p>No resources match your search criteria.</p>
      </div>
        }
    </div>
  `,
  styles: [`
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-light: #dbeafe;
      --mnara-primary-dark: #1d4ed8;
      --mnara-surface: #ffffff;
      --mnara-bg: #f1f5f9;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      --mnara-success: #10b981;
      --mnara-success-bg: #d1fae5;
      --mnara-error: #ef4444;
      --mnara-error-bg: #fee2e2;
      --mnara-warning: #f59e0b;
      --mnara-warning-bg: #fef3c7;
      --mnara-gray: #6b7280;
      --mnara-gray-bg: #f3f4f6;
      display: block;
      font-family: 'Inter', sans-serif;
      background: var(--mnara-bg);
      min-height: 100vh;
      padding: 24px;
    }
    .page { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--mnara-text); margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: var(--mnara-text-secondary); margin: 4px 0 0; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--mnara-primary); color: white; border: none;
      padding: 10px 20px; border-radius: 8px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background 0.15s ease;
    }
    .btn-primary:hover { background: var(--mnara-primary-dark); }
    .btn-primary mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .search-card { padding: 16px 20px; margin-bottom: 12px; border-radius: 12px; border: 1px solid var(--mnara-border); }
    .search-row { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 240px; }
    .subject-field { width: 200px; }
    .results-info { padding: 8px 4px 16px; font-size: 0.8125rem; color: var(--mnara-text-secondary); font-weight: 500; }
    .resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .resource-card { border-radius: 12px; border: 1px solid var(--mnara-border); overflow: hidden; display: flex; transition: box-shadow 0.15s ease; }
    .resource-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .resource-icon-area { padding: 20px 0 20px 20px; flex-shrink: 0; }
    .resource-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .resource-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .icon-notes { background: var(--mnara-primary-light); color: var(--mnara-primary-dark); }
    .icon-video { background: #fee2e2; color: #991b1b; }
    .icon-worksheet { background: var(--mnara-success-bg); color: #065f46; }
    .icon-past-paper { background: #ede9fe; color: #5b21b6; }
    .icon-coursebook { background: #ffedd5; color: #c2410c; }
    .resource-body { padding: 20px; flex: 1; min-width: 0; }
    .resource-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .resource-title { font-size: 0.9375rem; font-weight: 600; color: var(--mnara-text); margin: 0; line-height: 1.3; }
    .type-badge {
      display: inline-flex; align-items: center; padding: 2px 8px;
      border-radius: 100px; font-size: 0.625rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
    }
    .type-notes { background: var(--mnara-primary-light); color: var(--mnara-primary-dark); }
    .type-video { background: #fee2e2; color: #991b1b; }
    .type-worksheet { background: var(--mnara-success-bg); color: #065f46; }
    .type-past-paper { background: #ede9fe; color: #5b21b6; }
    .type-coursebook { background: #ffedd5; color: #c2410c; }
    .resource-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--mnara-text-secondary); }
    .meta-item mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .resource-actions { display: flex; gap: 8px; align-items: center; }
    .btn-download {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--mnara-primary); color: white; border: none;
      padding: 6px 14px; border-radius: 6px; font-size: 0.8125rem;
      font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background 0.15s ease;
    }
    .btn-download:hover { background: var(--mnara-primary-dark); }
    .btn-download mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: 6px; border: 1px solid var(--mnara-border);
      background: var(--mnara-surface); color: var(--mnara-text-secondary);
      cursor: pointer; transition: all 0.15s ease;
    }
    .btn-icon:hover { border-color: var(--mnara-primary); color: var(--mnara-primary); }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px 24px; color: var(--mnara-text-secondary); }
    .empty-icon { font-size: 56px; width: 56px; height: 56px; margin-bottom: 16px; opacity: 0.3; }
    .empty-state p { font-size: 0.9375rem; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesComponent {

  readonly searchQuery = signal<string>('');
  readonly subjectFilter = signal<string>('All');

  private readonly allResources = signal<Resource[]>([
    { id: 1, title: 'Algebra Fundamentals', type: 'NOTES', subject: 'Mathematics', subjectCode: 'MATH', uploadedAt: '2026-05-10', fileSize: '2.4 MB' },
    { id: 2, title: 'Newton\'s Laws Explained', type: 'VIDEO', subject: 'Physics', subjectCode: 'PHY', uploadedAt: '2026-05-08', fileSize: '45 MB' },
    { id: 3, title: 'Periodic Table Worksheet', type: 'WORKSHEET', subject: 'Chemistry', subjectCode: 'CHEM', uploadedAt: '2026-05-05', fileSize: '1.1 MB' },
    { id: 4, title: 'KCSE Mathematics 2024', type: 'PAST_PAPER', subject: 'Mathematics', subjectCode: 'MATH', uploadedAt: '2026-04-28', fileSize: '3.2 MB' },
    { id: 5, title: 'Cell Biology Coursebook Chapter 3', type: 'COURSEBOOK', subject: 'Biology', subjectCode: 'BIO', uploadedAt: '2026-04-20', fileSize: '8.7 MB' },
    { id: 6, title: 'Organic Chemistry Reactions', type: 'NOTES', subject: 'Chemistry', subjectCode: 'CHEM', uploadedAt: '2026-04-15', fileSize: '1.8 MB' },
    { id: 7, title: 'Wave Motion Demo Video', type: 'VIDEO', subject: 'Physics', subjectCode: 'PHY', uploadedAt: '2026-04-10', fileSize: '32 MB' },
    { id: 8, title: 'Genetics Practice Questions', type: 'WORKSHEET', subject: 'Biology', subjectCode: 'BIO', uploadedAt: '2026-04-05', fileSize: '890 KB' },
    { id: 9, title: 'KCSE Physics 2023 Past Paper', type: 'PAST_PAPER', subject: 'Physics', subjectCode: 'PHY', uploadedAt: '2026-03-28', fileSize: '2.9 MB' },
    { id: 10, title: 'Shakespeare\'s Macbeth Guide', type: 'NOTES', subject: 'English', subjectCode: 'ENG', uploadedAt: '2026-03-20', fileSize: '1.5 MB' },
    { id: 11, title: 'World War II Coursebook', type: 'COURSEBOOK', subject: 'History', subjectCode: 'HIST', uploadedAt: '2026-03-15', fileSize: '12 MB' },
    { id: 12, title: 'Calculus Derivatives Worksheet', type: 'WORKSHEET', subject: 'Mathematics', subjectCode: 'MATH', uploadedAt: '2026-03-10', fileSize: '720 KB' },
  ]);

  readonly filteredResources = computed(() => {
    let items = this.allResources();
    const subject = this.subjectFilter();
    if (subject !== 'All') {
      items = items.filter(r => r.subject === subject);
    }
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      items = items.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.subject.toLowerCase().includes(query)
      );
    }
    return items;
  });

  typeLabel(type: string): string {
    switch (type) {
      case 'NOTES': return 'Notes';
      case 'VIDEO': return 'Video';
      case 'WORKSHEET': return 'Worksheet';
      case 'PAST_PAPER': return 'Past Paper';
      case 'COURSEBOOK': return 'Coursebook';
      default: return type;
    }
  }

  typeIcon(type: string): string {
    switch (type) {
      case 'NOTES': return 'article';
      case 'VIDEO': return 'play_circle';
      case 'WORKSHEET': return 'assignment';
      case 'PAST_PAPER': return 'history_edu';
      case 'COURSEBOOK': return 'menu_book';
      default: return 'description';
    }
  }

  uploadResource() { }
  downloadResource(r: Resource) {}
  previewResource(r: Resource) {}
  shareResource(r: Resource) {}
}
