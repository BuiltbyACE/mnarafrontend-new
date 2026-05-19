import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { WorkspacesService, CourseWorkspace } from '../services/workspaces.service';

@Component({
  selector: 'app-classes-list',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatDividerModule,
  ],
  templateUrl: './classes-list.component.html',
  styleUrls: ['./classes-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassesListComponent implements OnInit {
  private workspacesService = inject(WorkspacesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly workspaces = signal<CourseWorkspace[]>([]);

  readonly totalStudents = computed(() =>
    this.workspaces().reduce((sum, w) => sum + (w.student_count ?? 0), 0)
  );

  ngOnInit(): void {
    this.workspacesService.fetchMyWorkspaces().subscribe({
      next: (data: CourseWorkspace[]) => {
        this.workspaces.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch workspaces:', err);
        this.errorMessage.set('Failed to load workspaces. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  enterWorkspace(id: number): void {
    this.router.navigate(['/teacher/workspace', id]);
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}