/**
 * Student Detail Component (360-Degree View)
 * Displays comprehensive student profile with tabs
 */

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { StudentsService } from '../../services/students.service';
import { StudentProfile, CarerData, MedicalRecord, CONDITION_LABELS, MedicalConditionKey } from '../../../../shared/models/students.models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
  ],
  template: `
    <div class="detail-container" *ngIf="student(); else loading">
      <!-- Header Section -->
      <div class="profile-header">
        <div class="profile-photo">
          <mat-icon>person</mat-icon>
        </div>
        <div class="profile-info">
          <h1>{{ student()?.first_name }} {{ student()?.last_name }}</h1>
          <div class="profile-meta">
            <span class="school-id">
              <mat-icon>badge</mat-icon>
              {{ student()?.user_school_id }}
            </span>
            <span class="enrollment-date">
              <mat-icon>event</mat-icon>
              Enrolled: {{ student()?.enrollment_date | date:'mediumDate' }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="generateFeeStatement()">
            <mat-icon>receipt</mat-icon>
            Generate Fee Statement
          </button>
          <button mat-stroked-button (click)="printAdmissionForm()">
            <mat-icon>print</mat-icon>
            Print Admission Form
          </button>
        </div>
      </div>

      <!-- Tabs Section -->
      <mat-tab-group class="detail-tabs">
        <!-- General Info Tab -->
        <mat-tab label="General Info">
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Gender</span>
                <span class="value">{{ student()?.admission_record?.gender || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Date of Birth</span>
                <span class="value">{{ student()?.date_of_birth | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Nationality</span>
                <span class="value">{{ student()?.admission_record?.nationality || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Current Class</span>
                <span class="value">{{ getCurrentClass() }}</span>
              </div>
              <div class="info-item">
                <span class="label">Admission Date</span>
                <span class="value">{{ student()?.admission_record?.date_of_admission | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Residence</span>
                <span class="value">{{ student()?.admission_record?.residence || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Medical Tab -->
        <mat-tab label="Medical">
          <div class="tab-content">
            @if (medicalRecord(); as medical) {
              <div class="medical-section">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Blood Group</span>
                    <span class="value">{{ getMedicalString('blood_group') }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Emergency Contact</span>
                    <span class="value">{{ getMedicalString('emergency_contact') }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Doctor Name</span>
                    <span class="value">{{ getMedicalString('doctor_name') }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Doctor Contact</span>
                    <span class="value">{{ getMedicalString('doctor_contact') }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Hospital Preference</span>
                    <span class="value">{{ getMedicalString('hospital_preference') || 'N/A' }}</span>
                  </div>
                </div>

                <mat-divider></mat-divider>

                @if (hasConditionsDetail()) {
                  <div class="checklist-section">
                    <h3>Medical Conditions</h3>
                    <div class="conditions-grid">
                      @for (item of activeConditions(); track item.key) {
                        <div class="condition-chip" [class.active]="item.active">
                          {{ item.label }}
                        </div>
                      }
                    </div>
                  </div>
                }

                <div class="checklist-section">
                  <h3>Allergies</h3>
                  <div class="chip-list">
                    @for (allergy of getMedicalStringArray('allergies'); track allergy) {
                      <mat-chip class="allergy-chip">{{ allergy }}</mat-chip>
                    } @empty {
                      <span class="no-data">No allergies recorded</span>
                    }
                  </div>
                </div>

                <div class="checklist-section">
                  <h3>Chronic Conditions</h3>
                  <div class="chip-list">
                    @for (condition of getMedicalStringArray('chronic_conditions'); track condition) {
                      <mat-chip class="condition-chip">{{ condition }}</mat-chip>
                    } @empty {
                      <span class="no-data">No chronic conditions</span>
                    }
                  </div>
                </div>

                <div class="immunization-status">
                  <mat-icon class="status-icon">check_circle</mat-icon>
                  <div>
                    <strong>Immunizations</strong>
                    <span>{{ medical.immunization_uptodate ? 'Up to date' : 'Not specified' }}</span>
                  </div>
                </div>
              </div>
            } @else {
              <div class="no-data-state">
                <mat-icon>medical_services</mat-icon>
                <p>No medical records available</p>
              </div>
            }
          </div>
        </mat-tab>

        <!-- Family & Siblings Tab -->
        <mat-tab label="Family & Siblings">
          <div class="tab-content">
            <h3>Carers</h3>
            <div class="carers-list">
              @for (carer of getCarers(); track carer.first_name + carer.surname) {
                <div class="carer-card">
                  <div class="carer-header">
                    <mat-icon>person</mat-icon>
                    <div>
                      <span class="carer-name">{{ carer.first_name }} {{ carer.surname }}</span>
                      <span class="carer-relation">{{ carer.relationship }} ({{ carer.carer_level }})</span>
                    </div>
                  </div>
                  <div class="carer-contact">
                    <span><mat-icon>email</mat-icon> {{ carer.email }}</span>
                    <span><mat-icon>phone</mat-icon> {{ carer.mobile_1 }}</span>
                    @if (carer.mobile_2) {
                      <span><mat-icon>phone</mat-icon> {{ carer.mobile_2 }}</span>
                    }
                    @if (carer.id_number) {
                      <span><mat-icon>badge</mat-icon> {{ carer.id_type }}: {{ carer.id_number }}</span>
                    }
                  </div>
                </div>
              } @empty {
                <span class="no-data">No carers recorded</span>
              }
            </div>

            <mat-divider></mat-divider>

            <h3>Siblings</h3>
            <div class="siblings-list">
              @for (sibling of getSiblings(); track sibling) {
                <div class="sibling-card" (click)="viewSibling(sibling)">
                  <mat-icon>person</mat-icon>
                  <div>
                    <span class="sibling-name">{{ sibling }}</span>
                    <span class="sibling-action">Click to view profile</span>
                  </div>
                </div>
              } @empty {
                <span class="no-data">No siblings recorded</span>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Commitment Tab -->
        <mat-tab label="Commitment">
          <div class="tab-content">
            <div class="commitment-tab">
              <mat-icon class="commitment-icon">gavel</mat-icon>
              <h3>Behaviour Commitment</h3>
              <p>Review and submit the student's behaviour commitment form to acknowledge school rules and behavioural standards.</p>
              <button mat-raised-button color="primary" (click)="viewCommitment()">
                <mat-icon>description</mat-icon>
                View / Submit Commitment Form
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>

    <ng-template #loading>
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <span>Loading student profile...</span>
      </div>
    </ng-template>
  `,
  styles: [`
    .detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .profile-photo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #94a3b8;
      }
    }

    .profile-info {
      flex: 1;

      h1 {
        font-size: 24px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 8px 0;
      }
    }

    .profile-meta {
      display: flex;
      gap: 16px;
      color: #64748b;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .detail-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tab-content {
      padding: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .value {
        font-size: 16px;
        color: #1e293b;
        font-weight: 500;
      }
    }

    .medical-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .checklist-section {
      margin-top: 16px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 8px 0;
      }
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .allergy-chip {
      background: #fef2f2;
      color: #dc2626;
    }

    .condition-chip {
      background: #fff7ed;
      color: #ea580c;
    }

    .immunization-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f0fdf4;
      border-radius: 8px;
      color: #16a34a;

      .status-icon {
        color: #16a34a;
      }
    }

    .carers-list, .siblings-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .carer-card {
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      .carer-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        mat-icon {
          color: #94a3b8;
        }
      }

      .carer-name {
        font-weight: 600;
        color: #1e293b;
      }

      .carer-relation {
        font-size: 12px;
        color: #64748b;
      }

      .carer-contact {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
        color: #64748b;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .sibling-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #f8fafc;
      }

      mat-icon {
        color: #94a3b8;
      }

      .sibling-name {
        font-weight: 500;
        color: #1e293b;
      }

      .sibling-action {
        font-size: 12px;
        color: #2563eb;
      }
    }

    .no-data {
      color: #94a3b8;
      font-style: italic;
    }

    .no-data-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px;
      color: #94a3b8;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }

    .conditions-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .condition-chip { padding: 4px 12px; border-radius: 12px; font-size: 12px; background: #f1f5f9; color: #64748b; }
    .condition-chip.active { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .commitment-tab { text-align: center; padding: 48px 24px; }
    .commitment-icon { font-size: 48px; width: 48px; height: 48px; color: #6366f1; margin-bottom: 16px; }
    .commitment-tab h3 { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 8px; }
    .commitment-tab p { color: #64748b; margin: 0 0 24px; max-width: 400px; margin-left: auto; margin-right: auto; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px;
      color: #64748b;
    }
  `],
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private studentsService = inject(StudentsService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  student = signal<StudentProfile | null>(null);
  medicalRecord = computed<MedicalRecord | null>(() => {
    return this.student()?.medical_record || null;
  });

  getMedicalString(key: string): string {
    const med = this.medicalRecord();
    if (!med) return 'N/A';
    const val = med[key as keyof MedicalRecord];
    return typeof val === 'string' ? val : 'N/A';
  }

  getMedicalStringArray(key: string): string[] {
    const med = this.medicalRecord();
    if (!med) return [];
    const val = med[key as keyof MedicalRecord];
    return Array.isArray(val) ? val as string[] : [];
  }

  hasConditionsDetail = computed(() => {
    const med = this.medicalRecord();
    return !!med?.conditions_detail && Object.values(med.conditions_detail).some(v => v);
  });

  activeConditions = computed(() => {
    const med = this.medicalRecord();
    if (!med?.conditions_detail) return [];
    return (Object.entries(med.conditions_detail) as [MedicalConditionKey, boolean][])
      .filter(([, v]) => v)
      .map(([key]) => ({ key, label: CONDITION_LABELS[key], active: true }));
  });

  ngOnInit(): void {
    const studentId = Number(this.route.snapshot.paramMap.get('id'));
    if (studentId) {
      this.studentsService.getStudentDetail(studentId).subscribe({
        next: (data) => this.student.set(data),
        error: (err) => console.error('Failed to load student', err),
      });
    }
  }

  getCurrentClass(): string {
    const enrollments = this.student()?.enrollments;
    if (enrollments && enrollments.length > 0) {
      return enrollments[0].classroom_name || 'N/A';
    }
    return 'N/A';
  }

  getCarers(): CarerData[] {
    const s = this.student();
    if (!s?.admission_record?.carers) return [];
    // Parse carers - they come as string array from backend
    try {
      return s.admission_record.carers.map((c: string) => JSON.parse(c) as CarerData);
    } catch {
      return [];
    }
  }

  getSiblings(): string[] {
    // Siblings are not in the current model - return empty array
    return [];
  }

  printAdmissionForm(): void {
    console.log('Print admission form for:', this.student()?.user_school_id);
    // TODO: Implement admission form printing
  }

  generateFeeStatement(): void {
    console.log('Generating fee statement...');
    this.snackBar.open('Generating fee statement...', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
    // TODO: Implement fee statement generation
  }

  viewCommitment(): void {
    const id = this.student()?.id;
    if (id) {
      this.router.navigate(['/portalAdmin/students', id, 'commitment']);
    }
  }

  viewSibling(sibling: any): void {
    console.log('Navigating to sibling:', sibling);
    // TODO: Implement navigation to sibling's profile
    // If sibling has an id, navigate to it
    if (sibling?.id) {
      this.router.navigate(['/portalAdmin/students', sibling.id]);
    } else {
      this.snackBar.open('Sibling profile not found', 'Close', { duration: 3000 });
    }
  }
}
