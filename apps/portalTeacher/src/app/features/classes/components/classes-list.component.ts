import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { WorkspacesService } from '../services/workspaces.service';

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
export class ClassesListComponent {
  private workspacesService = inject(WorkspacesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly workspaces = computed(() => this.workspacesService.workspaces());
  readonly isLoading = computed(() => this.workspacesService.isLoading());
  readonly hasError = computed(() => this.workspacesService.error() !== null);

  readonly totalStudents = computed(() =>
    this.workspaces().reduce((sum, w) => sum + (w.student_count ?? 0), 0)
  );

  enterWorkspace(id: number): void {
    this.router.navigate(['../workspaces', id], { relativeTo: this.route });
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
