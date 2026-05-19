import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  WorkspacesService,
  CourseWorkspace,
  Assignment,
  Resource,
} from '../services/workspaces.service';

type TabId = 'assignments' | 'resources' | 'gradebook' | 'attendance' | 'roster';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, TitleCasePipe, DatePipe],
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
  readonly isTabLoading = signal(false);

  ngOnInit(): void {
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
  }

  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  getFileIcon(type: string): string {
    const map: Record<string, string> = {
      pdf: 'picture_as_pdf',
      video: 'play_circle',
      doc: 'article',
      link: 'link',
    };
    return map[type] ?? 'attach_file';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      published: 'status-published',
      draft: 'status-draft',
      closed: 'status-closed',
    };
    return map[status] ?? '';
  }

  formatDueDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  isDueSoon(dateStr: string): boolean {
    const due = new Date(dateStr);
    const now = new Date();
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}