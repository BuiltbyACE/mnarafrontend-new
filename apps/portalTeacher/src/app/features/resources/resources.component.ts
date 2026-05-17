import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { Resource } from '../../shared/models/teacher.models';
import { TeacherResourceService } from '../../core/services/teacher-resource.service';

@Component({
  selector: 'app-teacher-resources',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule],
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
            <mat-label>Type</mat-label>
            <mat-select [value]="typeFilter()" (selectionChange)="typeFilter.set($event.value)">
              <mat-option value="All">All Types</mat-option>
              <mat-option value="DOCUMENT">Document</mat-option>
              <mat-option value="VIDEO">Video</mat-option>
              <mat-option value="LINK">Link</mat-option>
              <mat-option value="SLIDES">Slides</mat-option>
              <mat-option value="TEXTBOOK">Textbook</mat-option>
              <mat-option value="COURSEBOOK">Coursebook</mat-option>
              <mat-option value="PAST_PAPER">Past Paper</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      @if (service.isLoading()) {
        <div class="loading">Loading resources...</div>
      } @else if (service.error(); as err) {
        <div class="error-banner">
          <mat-icon>error</mat-icon> {{ err }}
        </div>
      } @else {
        <div class="results-info">
          <span>{{ filteredResources().length }} resource{{ filteredResources().length !== 1 ? 's' : '' }} found</span>
        </div>

        <div class="resource-grid">
          @for (r of filteredResources(); track r.id) {
          <mat-card class="resource-card">
            <div class="resource-icon-area">
              <div class="resource-icon" [class]="'icon-' + r.type.toLowerCase()">
                <mat-icon>{{ typeIcon(r.type) }}</mat-icon>
              </div>
            </div>
            <div class="resource-body">
              <div class="resource-header">
                <h3 class="resource-title">{{ r.title }}</h3>
                <span class="type-badge" [class]="'type-' + r.type.toLowerCase()">
                  {{ typeLabel(r.type) }}
                </span>
              </div>
              @if (r.description) {
                <p class="resource-desc">{{ r.description }}</p>
              }
              <div class="resource-meta">
                <span class="meta-item">
                  <mat-icon>book</mat-icon>
                  {{ r.subject }}
                </span>
                <span class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  {{ r.created_at | date:'MMM d, y' }}
                </span>
                @if (r.file_size_mb != null) {
                <span class="meta-item">
                  <mat-icon>storage</mat-icon>
                  {{ r.file_size_mb }} MB
                </span>
                }
                @if (!r.is_published) {
                  <span class="draft-badge">Draft</span>
                }
              </div>
              <div class="resource-actions">
                @if (r.file_attachment) {
                  <a class="btn-download" [href]="r.file_attachment" target="_blank">
                    <mat-icon>download</mat-icon>
                    Download
                  </a>
                } @else if (r.external_url) {
                  <a class="btn-download" [href]="r.external_url" target="_blank">
                    <mat-icon>open_in_new</mat-icon>
                    Open
                  </a>
                }
                <button mat-icon-button [matMenuTriggerFor]="menu" class="btn-icon">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="deleteResource(r)"><mat-icon>delete</mat-icon> Delete</button>
                </mat-menu>
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
      }
    </div>
  `,
  styles: [`
    :host {
      --p: #2563eb; --pl: #dbeafe; --pd: #1d4ed8;
      --s: #fff; --b: #f1f5f9; --t: #1e293b; --ts: #64748b; --bo: #e2e8f0;
      display: block; min-height: 100vh; background: var(--b); font-family: 'Inter', sans-serif; padding: 24px;
    }
    .page { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--t); margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: var(--ts); margin: 4px 0 0; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--p); color: white; border: none;
      padding: 10px 20px; border-radius: 8px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background 0.15s ease;
    }
    .btn-primary:hover { background: var(--pd); }
    .btn-primary mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .search-card { padding: 16px 20px; margin-bottom: 12px; border-radius: 12px; border: 1px solid var(--bo); }
    .search-row { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 240px; }
    .subject-field { width: 200px; }
    .loading, .error-banner { padding: 40px; text-align: center; color: var(--ts); }
    .error-banner { color: #dc2626; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .results-info { padding: 8px 4px 16px; font-size: 0.8125rem; color: var(--ts); font-weight: 500; }
    .resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
    .resource-card { border-radius: 12px; border: 1px solid var(--bo); overflow: hidden; display: flex; transition: box-shadow 0.15s ease; }
    .resource-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .resource-icon-area { padding: 20px 0 20px 20px; flex-shrink: 0; }
    .resource-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .resource-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .icon-document { background: var(--pl); color: var(--pd); }
    .icon-video { background: #fee2e2; color: #991b1b; }
    .icon-link { background: #e0e7ff; color: #3730a3; }
    .icon-slides { background: #ffedd5; color: #c2410c; }
    .icon-textbook { background: #d1fae5; color: #065f46; }
    .icon-coursebook { background: #d1fae5; color: #065f46; }
    .icon-past_paper { background: #ede9fe; color: #5b21b6; }
    .resource-body { padding: 20px; flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .resource-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
    .resource-title { font-size: 0.9375rem; font-weight: 600; color: var(--t); margin: 0; line-height: 1.3; }
    .resource-desc { font-size: 0.8125rem; color: var(--ts); margin: 4px 0 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .type-badge {
      display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 100px; font-size: 0.625rem;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
    }
    .type-document { background: var(--pl); color: var(--pd); }
    .type-video { background: #fee2e2; color: #991b1b; }
    .type-link { background: #e0e7ff; color: #3730a3; }
    .type-slides { background: #ffedd5; color: #c2410c; }
    .type-textbook { background: #d1fae5; color: #065f46; }
    .type-coursebook { background: #d1fae5; color: #065f46; }
    .type-past_paper { background: #ede9fe; color: #5b21b6; }
    .draft-badge { font-size: 0.625rem; font-weight: 600; padding: 1px 6px; border-radius: 100px; background: #f3f4f6; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
    .resource-meta { display: flex; flex-wrap: wrap; gap: 12px; margin: 8px 0 12px; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--ts); }
    .meta-item mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .resource-actions { display: flex; gap: 8px; align-items: center; margin-top: auto; }
    .btn-download {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--p); color: white; border: none;
      padding: 6px 14px; border-radius: 6px; font-size: 0.8125rem;
      font-weight: 500; cursor: pointer; text-decoration: none; font-family: 'Inter', sans-serif;
      transition: background 0.15s ease;
    }
    .btn-download:hover { background: var(--pd); }
    .btn-download mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-icon { color: var(--ts); }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px 24px; color: var(--ts); }
    .empty-icon { font-size: 56px; width: 56px; height: 56px; margin-bottom: 16px; opacity: 0.3; }
    .empty-state p { font-size: 0.9375rem; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesComponent {
  private router = inject(Router);
  readonly service = inject(TeacherResourceService);

  readonly searchQuery = signal<string>('');
  readonly typeFilter = signal<string>('All');

  private readonly allResources = this.service.resources;

  constructor() {
    this.service.fetchResources();
  }

  readonly filteredResources = computed(() => {
    let items = this.allResources();
    const type = this.typeFilter();
    if (type !== 'All') {
      items = items.filter(r => r.type === type);
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
    const map: Record<string, string> = {
      DOCUMENT: 'Document', VIDEO: 'Video', LINK: 'Link',
      SLIDES: 'Slides', TEXTBOOK: 'Textbook', COURSEBOOK: 'Coursebook',
      PAST_PAPER: 'Past Paper',
    };
    return map[type] ?? type;
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      DOCUMENT: 'article', VIDEO: 'play_circle', LINK: 'link',
      SLIDES: 'slideshow', TEXTBOOK: 'menu_book', COURSEBOOK: 'menu_book',
      PAST_PAPER: 'history_edu',
    };
    return map[type] ?? 'description';
  }

  uploadResource(): void {
    this.router.navigate(['/teacher/resources/upload']);
  }

  deleteResource(r: { id: number; title: string }): void {
    if (confirm(`Delete "${r.title}"?`)) {
      this.service.deleteResource(r.id);
    }
  }
}
