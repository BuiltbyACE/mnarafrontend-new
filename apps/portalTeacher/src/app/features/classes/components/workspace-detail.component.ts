import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ResourceViewerComponent } from '@sms/shared/ui';
import {
  WorkspacesService,
  CourseWorkspace,
  Assignment,
  Resource,
  RosterStudent,
  GradebookData,
} from '../services/workspaces.service';

type TabId = 'assignments' | 'cats' | 'resources' | 'gradebook' | 'attendance' | 'roster';
type FilterType = 'ALL' | 'QUIZ' | 'ONLINE_TEXT' | 'FILE_UPLOAD' | 'PHYSICAL';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, TitleCasePipe, DatePipe, MatTableModule, MatMenuModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private workspacesService = inject(WorkspacesService);

  readonly workspace = signal<CourseWorkspace | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<TabId>('assignments');

  readonly assignments = signal<Assignment[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly roster = signal<RosterStudent[]>([]);
  readonly gradebook = signal<GradebookData | null>(null);
  readonly isTabLoading = signal(false);

  private router = inject(Router);

  readonly activeFilter = signal<FilterType>('ALL');
  readonly displayedColumns = ['title', 'type', 'dueDate', 'submissions', 'status', 'actions'];

  readonly filterTabs = [
    { key: 'All', label: 'All', icon: 'library_books' },
    { key: 'Favorites', label: 'Favorites', icon: 'favorite' },
    { key: 'DOCUMENT', label: 'Documents', icon: 'article' },
    { key: 'VIDEO', label: 'Videos', icon: 'play_circle' },
    { key: 'LINK', label: 'Links', icon: 'link' },
    { key: 'SLIDES', label: 'Slides', icon: 'slideshow' },
    { key: 'TEXTBOOK', label: 'Textbooks', icon: 'menu_book' },
    { key: 'COURSEBOOK', label: 'Coursebooks', icon: 'auto_stories' },
    { key: 'PAST_PAPER', label: 'Past Papers', icon: 'history_edu' },
  ];

  readonly resourceSearchQuery = signal<string>('');
  readonly resourceTypeFilter = signal<string>('All');

  readonly filteredWorkspaceResources = computed(() => {
    let items = this.resources();
    const type = this.resourceTypeFilter();
    if (type === 'Favorites') {
      items = items.filter(r => r.is_favorite);
    } else if (type !== 'All') {
      items = items.filter(r => r.type === type);
    }
    const query = this.resourceSearchQuery().toLowerCase().trim();
    if (query) {
      items = items.filter(r =>
        r.title.toLowerCase().includes(query)
      );
    }
    return items;
  });

  readonly filteredAssignments = computed(() => {
    const filter = this.activeFilter();
    const all = this.assignments().filter(a => !a.assignment_category || a.assignment_category === 'GENERAL');
    if (filter === 'ALL') return all;
    return all.filter(a => a.submission_type === filter);
  });

  readonly filteredCats = computed(() => {
    const filter = this.activeFilter();
    const all = this.assignments().filter(a => a.assignment_category && a.assignment_category !== 'GENERAL');
    if (filter === 'ALL') return all;
    return all.filter(a => a.submission_type === filter);
  });

  ngOnInit(): void {
    const url = this.router.url;
    if (url.endsWith('/gradebook')) {
      this.activeTab.set('gradebook');
    }
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');
        if (!id) throw new Error('No workspace ID in route');
        this.isLoading.set(true);
        this.errorMessage.set(null);
        return this.workspacesService.getWorkspaceById(id);
      })
    ).subscribe({
      next: (data: CourseWorkspace) => {
        this.workspace.set(data);
        this.isLoading.set(false);
        this.fetchTabData(data.id);
      },
      error: (err) => {
        console.error('Failed to load workspace:', err);
        this.errorMessage.set('Failed to load workspace. You may not have access to this class.');
        this.isLoading.set(false);
      },
    });
  }

  private fetchTabData(workspaceId: number): void {
    this.isTabLoading.set(true);
    this.workspacesService.getAssignments(workspaceId).subscribe({
      next: (data) => {
        this.assignments.set(data);
        this.isTabLoading.set(false);
      },
      error: () => {
        this.assignments.set([]);
        this.isTabLoading.set(false);
      },
    });
    this.workspacesService.getResources(workspaceId).subscribe({
      next: (data) => this.resources.set(data),
      error: () => this.resources.set([]),
    });
    this.workspacesService.getRoster(workspaceId).subscribe({
      next: (data) => this.roster.set(data),
      error: () => this.roster.set([]),
    });
    this.workspacesService.getGradebook(workspaceId).subscribe({
      next: (data) => this.gradebook.set(data),
      error: () => this.gradebook.set(null),
    });
  }

  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  getFileIcon(type: string): string {
    if (!type) return 'attach_file';
    const map: Record<string, string> = {
      pdf: 'picture_as_pdf',
      video: 'play_circle',
      doc: 'article',
      link: 'link',
    };
    return map[type.toLowerCase()] ?? 'attach_file';
  }

  getStatusClass(is_published: boolean, status: string): string {
    if (!is_published) return 'status-draft';
    if (status === 'GRADED') return 'status-closed';
    return 'status-published';
  }

  formatDueDate(dateStr: string | null): string {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  isDueSoon(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const due = new Date(dateStr);
    const now = new Date();
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  }

  isOverdue(dateStr: string | null): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  setFilter(filter: FilterType) {
    this.activeFilter.set(filter);
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'QUIZ': return 'Quiz';
      case 'ONLINE_TEXT': return 'Online Text';
      case 'FILE_UPLOAD': return 'File Upload';
      case 'PHYSICAL': return 'Physical';
      default: return type;
    }
  }

  typeIconColor(type: string): string {
    switch (type) {
      case 'QUIZ': return '#7c3aed';
      case 'ONLINE_TEXT': return '#2563eb';
      case 'FILE_UPLOAD': return '#ea580c';
      case 'PHYSICAL': return '#059669';
      default: return '#64748b';
    }
  }

  resourceTypeLabel(type: string): string {
    const map: Record<string, string> = {
      DOCUMENT: 'Document', VIDEO: 'Video', LINK: 'Link',
      SLIDES: 'Slides', TEXTBOOK: 'Textbook', COURSEBOOK: 'Coursebook',
      PAST_PAPER: 'Past Paper',
    };
    return map[type] ?? type;
  }

  resourceTypeIcon(type: string): string {
    const map: Record<string, string> = {
      DOCUMENT: 'article', VIDEO: 'play_circle', LINK: 'link',
      SLIDES: 'slideshow', TEXTBOOK: 'menu_book', COURSEBOOK: 'menu_book',
      PAST_PAPER: 'history_edu',
    };
    return map[type] ?? 'description';
  }

  createAssignment() {
    const ws = this.workspace();
    if (ws) this.router.navigate(['/teacher/workspace', ws.id, 'assignments', 'create']);
  }

  viewAssignment(a: Assignment) {
    const ws = this.workspace();
    if (ws) this.router.navigate(['/teacher/workspace', ws.id, 'assignments', a.id]);
  }

  editAssignment(a: Assignment) {
    const ws = this.workspace();
    if (ws) this.router.navigate(['/teacher/workspace', ws.id, 'assignments', a.id, 'edit']);
  }

  viewSubmissions(a: Assignment) {
    const ws = this.workspace();
    if (ws) this.router.navigate(['/teacher/workspace', ws.id, 'assignments', a.id, 'submissions']);
  }

  deleteAssignment(a: Assignment) {
    // To be implemented
  }

  toggleResourcePublish(r: Resource): void {
    this.workspacesService.toggleResourcePublish(r.id).subscribe({
      next: (res) => {
        this.resources.update(list =>
          list.map(item =>
            item.id === r.id ? { ...item, is_published: res.is_published } : item
          )
        );
      },
    });
  }

  toggleResourceFavorite(r: Resource): void {
    this.workspacesService.toggleResourceFavorite(r.id).subscribe({
      next: (res) => {
        this.resources.update(list =>
          list.map(item =>
            item.id === r.id ? { ...item, is_favorite: res.is_favorite } : item
          )
        );
      },
    });
  }

  uploadResource() {
    const ws = this.workspace();
    if (ws) {
      this.router.navigate(['/teacher/resources/upload'], {
        queryParams: { courseId: ws.id }
      });
    }
  }

  private readonly dialog = inject(MatDialog);

  openResource(r: Resource): void {
    this.dialog.open(ResourceViewerComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: {
        title: r.title,
        type: r.type,
        url: r.url
      },
      panelClass: 'resource-viewer-dialog'
    });
  }
}