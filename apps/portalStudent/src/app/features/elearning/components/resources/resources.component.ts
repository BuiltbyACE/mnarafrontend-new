import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResourcesService, ResourceDTO } from '../../services/resources.service';

type FilterKey = 'ALL' | 'video' | 'textbook' | 'coursebook' | 'past-paper';

interface FilterTab {
  key: FilterKey;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-resources',
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    DatePipe, NgClass,
  ],
  template: `
    <div class="resources-page">
      <div class="page-heading">
        <h2>Learning Resources</h2>
        <p>Access videos, textbooks, coursebooks, and past papers</p>
      </div>

      <div class="filter-bar">
        @for (tab of filterTabs; track tab.key) {
          <button
            class="filter-chip"
            [class.active]="activeFilter() === tab.key"
            (click)="activeFilter.set(tab.key)"
          >
            <mat-icon>{{ tab.icon }}</mat-icon>
            {{ tab.label }}
          </button>
        }
      </div>

      @if (service.isLoading()) {
        <div class="loading-state"><mat-spinner diameter="36" /><p>Loading resources...</p></div>
      } @else {
        <div class="resources-grid">
          @for (r of filteredResources(); track r.id) {
            <mat-card class="resource-card" appearance="outlined">
              <mat-card-content>
                <div class="card-top">
                  <span class="type-badge" [ngClass]="'type-' + r.resource_type">
                    <mat-icon>
                      {{ r.resource_type === 'video' ? 'play_circle' : r.resource_type === 'textbook' ? 'menu_book' : r.resource_type === 'coursebook' ? 'auto_stories' : 'description' }}
                    </mat-icon>
                    {{ r.resource_type === 'video' ? 'Video' : r.resource_type === 'textbook' ? 'Textbook' : r.resource_type === 'coursebook' ? 'Coursebook' : 'Past Paper' }}
                  </span>
                </div>
                <h3 class="card-title">{{ r.title }}</h3>
                <div class="card-subject">
                  <mat-icon>school</mat-icon>
                  {{ r.subject }}
                </div>
                <p class="card-desc">{{ r.description }}</p>
              </mat-card-content>
              <mat-card-actions>
                <div class="card-footer">
                  <div class="footer-meta">
                    <span class="meta-date">{{ r.created_at | date:'mediumDate' }}</span>
                    <span class="meta-sep">&middot;</span>
                    <span class="meta-size">{{ r.file_size_mb }} MB</span>
                  </div>
                  <button mat-raised-button color="primary" class="action-btn">
                    <mat-icon>{{ r.resource_type === 'video' ? 'play_arrow' : 'download' }}</mat-icon>
                    {{ r.resource_type === 'video' ? 'Watch' : 'Download' }}
                  </button>
                </div>
              </mat-card-actions>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon>library_books</mat-icon>
              <p>No {{ activeFilter() === 'ALL' ? '' : (activeFilter().toLowerCase()) }} resources found</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .resources-page { max-width: 1200px; }

    .page-heading { margin-bottom: 24px; }
    .page-heading h2 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #0f172a; }
    .page-heading p { margin: 4px 0 0; color: #64748b; font-size: 0.9rem; }

    .filter-bar {
      display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;
    }

    .filter-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border: 1px solid #e2e8f0; border-radius: 100px;
      background: #fff; color: #64748b; cursor: pointer;
      font-size: 0.85rem; font-weight: 500;
      transition: all 0.2s ease;
    }
    .filter-chip:hover { border-color: #818cf8; color: #6366f1; background: #f8f7ff; }
    .filter-chip.active { background: #6366f1; color: #fff; border-color: #6366f1; box-shadow: 0 2px 8px rgba(99,102,241,0.25); }
    .filter-chip mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; min-height: 260px; justify-content: center; color: #64748b;
    }

    .resources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .resource-card {
      border: 1px solid #e2e8f0 !important;
      border-radius: 14px !important;
      overflow: hidden;
      transition: box-shadow 0.3s ease, transform 0.2s ease;
    }
    .resource-card:hover {
      box-shadow: 0 12px 32px rgba(0,0,0,0.07);
      transform: translateY(-3px);
    }
    .resource-card mat-card-content { padding: 20px 20px 0 !important; }
    .resource-card mat-card-actions { padding: 12px 20px !important; }

    .card-top { margin-bottom: 14px; }

    .type-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 100px;
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .type-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .type-badge.type-video { color: #dc2626; background: #fef2f2; }
    .type-badge.type-textbook { color: #2563eb; background: #eff6ff; }
    .type-badge.type-coursebook { color: #059669; background: #ecfdf5; }
    .type-badge.type-past-paper { color: #d97706; background: #fffbeb; }

    .card-title {
      margin: 0 0 8px; font-size: 1.05rem; font-weight: 700; color: #0f172a;
      line-height: 1.3;
    }

    .card-subject {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.8rem; color: #6366f1; font-weight: 500; margin-bottom: 10px;
    }
    .card-subject mat-icon { font-size: 16px; width: 16px; height: 16px; color: #818cf8; }

    .card-desc {
      margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: flex; align-items: center; justify-content: space-between; width: 100%;
    }

    .footer-meta {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: #94a3b8;
    }
    .meta-sep { color: #cbd5e1; margin: 0 2px; }

    .action-btn {
      min-width: unset !important; padding: 4px 16px !important;
      font-size: 0.8rem !important;
    }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }

    .empty-state {
      grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; color: #cbd5e1; }
    .empty-state p { margin: 0; font-size: 1rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesComponent implements OnInit {
  readonly service = inject(ResourcesService);

  readonly activeFilter = signal<FilterKey>('ALL');

  readonly filterTabs: FilterTab[] = [
    { key: 'ALL', label: 'All', icon: 'library_books' },
    { key: 'video', label: 'Videos', icon: 'play_circle' },
    { key: 'textbook', label: 'Textbooks', icon: 'menu_book' },
    { key: 'coursebook', label: 'Coursebooks', icon: 'auto_stories' },
    { key: 'past-paper', label: 'Past Papers', icon: 'description' },
  ];

  readonly filteredResources = computed(() => {
    const all = this.service.resources();
    const f = this.activeFilter();
    return f === 'ALL' ? all : all.filter(r => r.resource_type === f);
  });

  ngOnInit(): void {
    this.service.fetchResources();
  }
}
