import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ExaminationsService } from '../../services/examinations.service';
import { ExamSeriesTableComponent } from '../exam-series-table/exam-series-table.component';
import { ExamComponentsTableComponent } from '../exam-components-table/exam-components-table.component';
import { ExamResultsTableComponent } from '../exam-results-table/exam-results-table.component';
import { ReportCardsTableComponent } from '../report-cards-table/report-cards-table.component';
import { ExamSeriesDialogComponent, ExamSeriesDialogData } from '../exam-series-dialog/exam-series-dialog.component';
import { ExamComponentDialogComponent, ExamComponentDialogData } from '../exam-component-dialog/exam-component-dialog.component';
import { ExamResultDialogComponent, ExamResultDialogData } from '../exam-result-dialog/exam-result-dialog.component';
import { ReportCardDialogComponent, ReportCardDialogData } from '../report-card-dialog/report-card-dialog.component';

@Component({
  selector: 'app-examinations-hub',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ExamSeriesTableComponent,
    ExamComponentsTableComponent,
    ExamResultsTableComponent,
    ReportCardsTableComponent,
  ],
  template: `
    <div class="hub-container">
      <div class="hub-header">
        <div class="header-content">
          <h1>Examinations Hub</h1>
          <p>Manage exam series, components, results, and report cards</p>
        </div>
        <div class="header-actions">
          <button mat-flat-button color="primary" (click)="openAddForTab()">
            <mat-icon>add</mat-icon>
            {{ addButtonLabel }}
          </button>
        </div>
      </div>

      @if (service.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <mat-tab-group animationDuration="0ms" (selectedTabChange)="onTabChange($event)">
          <mat-tab label="Exam Series">
            <ng-template matTabContent>
              <app-exam-series-table></app-exam-series-table>
            </ng-template>
          </mat-tab>

          <mat-tab label="Components">
            <ng-template matTabContent>
              <app-exam-components-table></app-exam-components-table>
            </ng-template>
          </mat-tab>

          <mat-tab label="Results">
            <ng-template matTabContent>
              <app-exam-results-table></app-exam-results-table>
            </ng-template>
          </mat-tab>

          <mat-tab label="Report Cards">
            <ng-template matTabContent>
              <app-report-cards-table></app-report-cards-table>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .hub-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .hub-header {
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
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
    .header-actions {
      flex-shrink: 0;
    }
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    mat-tab-group {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      overflow: hidden;
    }
    ::ng-deep .mat-mdc-tab-body-content {
      padding: 0;
    }
  `],
})
export class ExaminationsHubComponent implements OnInit {
  readonly service = inject(ExaminationsService);
  readonly dialog = inject(MatDialog);

  selectedIndex = 0;

  get addButtonLabel(): string {
    switch (this.selectedIndex) {
      case 0: return 'Add Exam Series';
      case 1: return 'Add Component';
      case 2: return 'Add Result';
      case 3: return 'Add Report Card';
      default: return 'Add';
    }
  }

  ngOnInit(): void {
    this.service.getExamSeries().subscribe();
    this.service.getExamComponents().subscribe();
    this.service.getExamResults().subscribe();
    this.service.getReportCards().subscribe();
  }

  onTabChange(event: any): void {
    this.selectedIndex = event.index;
  }

  openAddForTab(): void {
    switch (this.selectedIndex) {
      case 0:
        this.openExamSeriesDialog();
        break;
      case 1:
        this.openExamComponentDialog();
        break;
      case 2:
        this.openExamResultDialog();
        break;
      case 3:
        this.openReportCardDialog();
        break;
    }
  }

  private openExamSeriesDialog(): void {
    const dialogRef = this.dialog.open<ExamSeriesDialogComponent, ExamSeriesDialogData>(ExamSeriesDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createExamSeries(result).subscribe();
      }
    });
  }

  private openExamComponentDialog(): void {
    const dialogRef = this.dialog.open<ExamComponentDialogComponent, ExamComponentDialogData>(ExamComponentDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createExamComponent(result).subscribe();
      }
    });
  }

  private openExamResultDialog(): void {
    const dialogRef = this.dialog.open<ExamResultDialogComponent, ExamResultDialogData>(ExamResultDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createExamResult(result).subscribe();
      }
    });
  }

  private openReportCardDialog(): void {
    const dialogRef = this.dialog.open<ReportCardDialogComponent, ReportCardDialogData>(ReportCardDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createReportCard(result).subscribe();
      }
    });
  }
}
