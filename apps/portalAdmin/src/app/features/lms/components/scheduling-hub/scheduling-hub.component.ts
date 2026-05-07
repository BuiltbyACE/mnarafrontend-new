import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SchedulingService } from '../../services/scheduling.service';
import { AcademicYearsTableComponent } from '../academic-years-table/academic-years-table.component';
import { TermsTableComponent } from '../terms-table/terms-table.component';
import { PeriodsTableComponent } from '../periods-table/periods-table.component';

@Component({
  selector: 'app-scheduling-hub',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    AcademicYearsTableComponent,
    TermsTableComponent,
    PeriodsTableComponent,
  ],
  template: `
    <div class="hub-container">
      <div class="hub-header">
        <div class="header-content">
          <h1>Scheduling Hub</h1>
          <p>Manage academic years, terms, and bell schedules</p>
        </div>
      </div>

      @if (service.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <mat-tab-group animationDuration="0ms">
          <mat-tab label="Academic Years">
            <ng-template matTabContent>
              <app-academic-years-table></app-academic-years-table>
            </ng-template>
          </mat-tab>

          <mat-tab label="Academic Terms">
            <ng-template matTabContent>
              <app-terms-table></app-terms-table>
            </ng-template>
          </mat-tab>

          <mat-tab label="Bell Schedule (Periods)">
            <ng-template matTabContent>
              <app-periods-table></app-periods-table>
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
export class SchedulingHubComponent implements OnInit {
  readonly service = inject(SchedulingService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.service.getAcademicYears().subscribe();
    this.service.getAcademicTerms().subscribe();
    this.service.getPeriods().subscribe();
  }
}
