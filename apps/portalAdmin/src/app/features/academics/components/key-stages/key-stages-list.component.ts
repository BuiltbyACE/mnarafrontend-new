import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AcademicsService, KeyStage } from '../../services/academics.service';
import { KeyStageDialogComponent } from './key-stage-dialog.component';

@Component({
  selector: 'app-key-stages-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Key Stages</h1>
          <p>Manage academic key stages and levels</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Key Stage
        </button>
      </div>

      <mat-card class="content-card">
        <div class="search-bar">
          <div class="search-field">
            <input placeholder="Search key stages..." [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
          </div>
        </div>

        @if (service.isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <table mat-table [dataSource]="filteredKeyStages()" class="full-width-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name &amp; Code</th>
              <td mat-cell *matCellDef="let row">
                <div class="cell-name-code">
                  <span class="ks-name">{{ row.name }}</span>
                  <span class="ks-code">{{ row.code }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let row">
                <span class="cell-desc">{{ row.description || '—' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="levels">
              <th mat-header-cell *matHeaderCellDef>Year Levels</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip-set>
                  @for (level of row.year_levels; track level) {
                    <mat-chip class="level-chip">{{ level }}</mat-chip>
                  }
                  @empty {
                    <span class="empty-levels">No levels assigned</span>
                  }
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="openEditDialog(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteKeyStage(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow><td class="mat-cell" [attr.colspan]="displayedColumns.length">No data available</td></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px;
    }

    .header-content p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .content-card {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }

    .search-bar {
      padding: 16px 16px 0;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .search-field input {
      width: 100%;
      max-width: 400px;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      color: #1f2937;
      background: #fff;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }
    .search-field input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
    }

    .full-width-table {
      width: 100%;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .cell-name-code {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ks-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
    }

    .ks-code {
      font-size: 0.6875rem;
      color: #94a3b8;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    }

    .cell-desc {
      font-size: 0.8125rem;
      color: #475569;
    }

    .level-chip {
      background: #ede9fe !important;
      color: #5b21b6 !important;
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0 10px;
      min-height: 24px;
      border-radius: 4px;
    }

    .empty-levels {
      font-size: 0.75rem;
      color: #94a3b8;
      font-style: italic;
    }

    .no-data-row {
      text-align: center;
    }

    .no-data-cell {
      padding: 48px;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }
    }
  `],
})
export class KeyStagesListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  readonly dialog = inject(MatDialog);

  searchQuery = signal('');
  displayedColumns = ['name', 'description', 'levels', 'actions'];

  readonly filteredKeyStages = computed(() => {
    const keyStages = this.service.keyStages();
    if (!this.searchQuery()) return keyStages;
    const query = this.searchQuery().toLowerCase();
    return keyStages.filter(ks => 
      ks.name.toLowerCase().includes(query) ||
      ks.code.toLowerCase().includes(query) ||
      (ks.description || '').toLowerCase().includes(query) ||
      ks.year_levels.some(l => l.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.service.getKeyStages().subscribe();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(KeyStageDialogComponent, {
      width: '500px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createKeyStage(result).subscribe({
          next: () => this.service.getKeyStages().subscribe()
        });
      }
    });
  }

  openEditDialog(keyStage: KeyStage): void {
    const dialogRef = this.dialog.open(KeyStageDialogComponent, {
      width: '500px',
      data: { isEdit: true, keyStage },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateKeyStage(keyStage.id, result).subscribe({
          next: () => this.service.getKeyStages().subscribe()
        });
      }
    });
  }

  deleteKeyStage(keyStage: KeyStage): void {
    if (confirm(`Delete ${keyStage.name}?`)) {
      this.service.deleteKeyStage(keyStage.id).subscribe({
        next: () => this.service.getKeyStages().subscribe()
      });
    }
  }
}

