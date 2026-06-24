import { Component, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { StudentsService } from '../../services/students.service';
import { AcademicsService } from '../../../academics/services/academics.service';
import {
  AdmissionCreatePayload, PathwayType, Gender,
  RegularSchoolDetails, RegularSchoolInterruptDetails,
  HomeschoolDetails, NoneEducationDetails,
  ArabicQuranData, SubjectExclusionData,
  MedicalRecord, CarerData, FamilyBackground,
  SiblingFormEntry, MedicalConditionKey,
} from '../../../../shared/models/students.models';

import { StudentInfoStep } from './steps/student-info-step';
import { ClassSelectionStep } from './steps/class-selection-step';
import { PathwaySelectionStep } from './steps/pathway-selection-step';
import { RegularSchoolStep } from './steps/regular-school-step';
import { RegularInterruptStep } from './steps/regular-interrupt-step';
import { HomeschoolStep } from './steps/homeschool-step';
import { NoneEducationStep } from './steps/none-education-step';
import { ArabicQuranStep } from './steps/arabic-quran-step';
import { SubjectExclusionsStep } from './steps/subject-exclusions-step';
import { MedicalStep } from './steps/medical-step';
import { CarersFamilyStep } from './steps/carers-family-step';
import { ReviewSubmitStep } from './steps/review-submit-step';

function emptyPayload(): AdmissionCreatePayload {
  return {
    first_name: '', last_name: '', date_of_birth: '', gender: 'M',
    religion: '', nationality: '', residence: '',
    year_level_id: 0, date_of_admission: '',
    pathway: 'REGULAR_SCHOOL',
    medical_record: {
      blood_group: '', allergies: [], chronic_conditions: [],
      emergency_contact: '', doctor_name: '', doctor_contact: '',
      hospital_preference: '', immunization_uptodate: false,
      immunization_notes: '', conditions_detail: {} as Record<MedicalConditionKey, boolean>,
      additional_notes: '',
    },
    carers: [
      { carer_level: 'PRIMARY', relationship: '', title: '', first_name: '', surname: '',
        email: '', mobile_1: '', nationality: '', occupation: '', employer: '', address: '' },
    ],
    siblings: [],
  };
}

@Component({
  selector: 'app-admission-wizard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatStepperModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule,
    StudentInfoStep, ClassSelectionStep, PathwaySelectionStep,
    RegularSchoolStep, RegularInterruptStep, HomeschoolStep, NoneEducationStep,
    ArabicQuranStep, SubjectExclusionsStep, MedicalStep,
    CarersFamilyStep, ReviewSubmitStep,
  ],
  template: `
    <div class="wizard-page" [class.in-dialog]="inDialog()">
      @if (!inDialog()) {
        <div class="wizard-header">
          <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1>New Student Admission</h1>
            <p class="subtitle">Complete all steps to register a new student</p>
          </div>
        </div>
      }

      <mat-stepper linear #stepper class="wizard-stepper" (selectionChange)="onStepChange($event)">

        <!-- Step 1: Student Info -->
        <mat-step [completed]="step1Valid()" [editable]="true">
          <ng-template matStepLabel>Student Info</ng-template>
          <app-student-info-step
            [data]="{ first_name: payload().first_name, last_name: payload().last_name, date_of_birth: payload().date_of_birth, gender: payload().gender, religion: payload().religion, nationality: payload().nationality, residence: payload().residence }"
            (dataChange)="updatePayload($event)"
            (validityChange)="step1Valid.set($event)" />
          <div class="step-actions">
            <button mat-raised-button color="primary" [disabled]="!step1Valid()" matStepperNext>Next</button>
          </div>
        </mat-step>

        <!-- Step 2: Class Selection -->
        <mat-step [completed]="step2Valid()" [editable]="true">
          <ng-template matStepLabel>Class</ng-template>
          <app-class-selection-step
            [data]="{ year_level_id: payload().year_level_id, date_of_admission: payload().date_of_admission }"
            [yearLevels]="yearLevels()"
            (dataChange)="updatePayload($event)"
            (validityChange)="step2Valid.set($event)" />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-raised-button color="primary" [disabled]="!step2Valid()" matStepperNext>Next</button>
          </div>
        </mat-step>

        <!-- Step 3: Pathway -->
        <mat-step [completed]="step3Valid()" [editable]="true">
          <ng-template matStepLabel>Pathway</ng-template>
          <app-pathway-selection-step
            [data]="{ pathway: payload().pathway }"
            [isUnder4]="isUnder4()"
            (dataChange)="updatePayload($event)"
            (validityChange)="step3Valid.set($event)" />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-raised-button color="primary" [disabled]="!step3Valid()" matStepperNext>Next</button>
          </div>
        </mat-step>

        <!-- Step 4: Pathway Detail (conditional) -->
        <mat-step [completed]="step4Valid()" [editable]="true">
          <ng-template matStepLabel>{{ step4Label() }}</ng-template>
          @switch (payload().pathway) {
            @case ('REGULAR_SCHOOL') {
              <app-regular-school-step
                [data]="regularDetails()"
                (dataChange)="updateRegularDetails($event)"
                (validityChange)="step4Valid.set($event)" />
            }
            @case ('REGULAR_SCHOOL_INTERRUPTED') {
              <app-regular-interrupt-step
                [data]="interruptDetails()"
                (dataChange)="updateInterruptDetails($event)"
                (validityChange)="step4Valid.set($event)" />
            }
            @case ('HOMESCHOOL') {
              <app-homeschool-step
                [data]="homeschoolDetails()"
                (dataChange)="updateHomeschoolDetails($event)"
                (validityChange)="step4Valid.set($event)" />
            }
            @case ('NONE') {
              <app-none-education-step
                [data]="noneDetails()"
                (dataChange)="updateNoneDetails($event)"
                (validityChange)="step4Valid.set($event)" />
            }
          }
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-raised-button color="primary" [disabled]="!step4Valid()" matStepperNext>Next</button>
          </div>
        </mat-step>

        <!-- Step 5: Arabic & Quran (skipped if under 4 and NONE pathway) -->
        @if (showArabicStep()) {
          <mat-step [completed]="step5Valid()" [editable]="true">
            <ng-template matStepLabel>Arabic/Quran</ng-template>
            <app-arabic-quran-step
              [data]="arabicData()"
              (dataChange)="updateArabicData($event)"
              (validityChange)="step5Valid.set($event)" />
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" [disabled]="!step5Valid()" matStepperNext>Next</button>
            </div>
          </mat-step>
        }

        <!-- Step 6: Subject Exclusions -->
        <mat-step [completed]="step6Valid()" [editable]="true">
          <ng-template matStepLabel>Subjects</ng-template>
          <app-subject-exclusions-step
            [data]="subjectExclusions()"
            (dataChange)="updateSubjectExclusions($event)"
            (validityChange)="step6Valid.set($event)" />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-raised-button color="primary" matStepperNext>Next</button>
          </div>
        </mat-step>

        <!-- Step 7: Medical -->
        <mat-step [completed]="step7Valid()" [editable]="true">
          <ng-template matStepLabel>Medical</ng-template>
          <app-medical-step
            [data]="payload().medical_record"
            (dataChange)="updateMedical($event)"
            (validityChange)="step7Valid.set($event)" />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-raised-button color="primary" matStepperNext>Next</button>
          </div>
        </mat-step>

        <!-- Step 8: Carers & Family -->
        <mat-step [completed]="step8Valid()" [editable]="true">
          <ng-template matStepLabel>Carers</ng-template>
          <app-carers-family-step
            [data]="{ carers: payload().carers, family_background: payload().family_background || null, siblings: payload().siblings }"
            (dataChange)="updateCarersFamily($event)"
            (validityChange)="step8Valid.set($event)" />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-raised-button color="primary" [disabled]="!step8Valid()" matStepperNext>Next</button>
          </div>
        </mat-step>

        <!-- Step 9: Review & Submit -->
        <mat-step>
          <ng-template matStepLabel>Review</ng-template>
          <app-review-submit-step
            [data]="payload()"
            [submitting]="isSubmitting()"
            [error]="submitError()"
            (submit)="onSubmit()" />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
          </div>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    .wizard-page { max-width: 900px; margin: 0 auto; padding: 24px; }
    .wizard-page.in-dialog { max-width: 100%; margin: 0; padding: 0; height: 100%; overflow-y: auto; }
    .wizard-page.in-dialog .wizard-stepper { border-radius: 0; box-shadow: none; padding: 20px 24px; }
    .wizard-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .wizard-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1e293b; }
    .wizard-header .subtitle { margin: 4px 0 0; color: #64748b; font-size: 14px; }
    .wizard-stepper { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; }
    .step-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px 0; border-top: 1px solid #e2e8f0; margin-top: 24px; }
  `]
})
export class AdmissionWizardComponent {
  private studentsService = inject(StudentsService);
  private academicsService = inject(AcademicsService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly inDialog    = input(false);
  readonly wizardClosed = output<boolean>();

  step1Valid = signal(false);
  step2Valid = signal(false);
  step3Valid = signal(false);
  step4Valid = signal(false);
  step5Valid = signal(false);
  step6Valid = signal(true);
  step7Valid = signal(true);
  step8Valid = signal(false);

  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  yearLevels = signal<any[]>([]);

  private state = signal<AdmissionCreatePayload>(emptyPayload());
  payload = computed(() => this.state());

  constructor() {
    this.academicsService.getYearLevels().subscribe({
      next: (levels) => this.yearLevels.set(levels),
      error: () => this.snackBar.open('Failed to load year levels', 'Close'),
    });
  }

  isUnder4 = computed(() => {
    const dob = this.state().date_of_birth;
    if (!dob) return false;
    const birth = new Date(dob);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    return age < 4;
  });

  showArabicStep = computed(() => {
    return !(this.isUnder4() && this.state().pathway === 'NONE');
  });

  step4Label = computed(() => {
    const labels: Record<string, string> = {
      REGULAR_SCHOOL: 'Regular School',
      REGULAR_SCHOOL_INTERRUPTED: 'Interrupted',
      HOMESCHOOL: 'Homeschool',
      NONE: 'No Education',
    };
    return labels[this.state().pathway] || 'Details';
  });

  regularDetails = computed<RegularSchoolDetails>(() => {
    const d = (this.state().regular_details || {}) as RegularSchoolDetails;
    return { school_name: d.school_name || '', curriculum: d.curriculum || '', transfer_reason: d.transfer_reason || '', previous_reports: d.previous_reports || false, last_attended_class: d.last_attended_class || '', last_attended_year: d.last_attended_year || '' };
  });

  interruptDetails = computed<RegularSchoolInterruptDetails>(() => {
    const d = (this.state().regular_details || {}) as RegularSchoolInterruptDetails;
    return { school_name: d.school_name || '', curriculum: d.curriculum || '', transfer_reason: d.transfer_reason || '', previous_reports: d.previous_reports || false, last_attended_class: d.last_attended_class || '', last_attended_year: d.last_attended_year || '', interruption_start: d.interruption_start || '', interruption_end: d.interruption_end || '', interruption_reason: d.interruption_reason || '' };
  });

  homeschoolDetails = computed<HomeschoolDetails>(() => {
    return this.state().homeschool_details || { supervisor_name: '', supervisor_qualification: '', supervisor_contact: '', content_covered: '', subjects: [] };
  });

  noneDetails = computed<NoneEducationDetails>(() => {
    return this.state().none_education_details || { reason: '', alternative_arrangement: '' };
  });

  arabicData = computed<ArabicQuranData>(() => {
    return this.state().arabic_quran_data || { arabic_proficiency: 'NONE', quran_memorization: '', quran_reading_level: 'NONE', tajweed_level: 'NONE', comments: '' };
  });

  subjectExclusions = computed<SubjectExclusionData>(() => {
    return this.state().subject_exclusions || { excluded_subjects: [] };
  });

  updatePayload(partial: any): void {
    this.state.update(s => ({ ...s, ...partial }));
  }

  updateRegularDetails(details: RegularSchoolDetails): void {
    this.state.update(s => ({ ...s, regular_details: details }));
  }

  updateInterruptDetails(details: RegularSchoolInterruptDetails): void {
    this.state.update(s => ({ ...s, regular_details: details }));
  }

  updateHomeschoolDetails(details: HomeschoolDetails): void {
    this.state.update(s => ({ ...s, homeschool_details: details }));
  }

  updateNoneDetails(details: NoneEducationDetails): void {
    this.state.update(s => ({ ...s, none_education_details: details }));
  }

  updateArabicData(data: ArabicQuranData): void {
    this.state.update(s => ({ ...s, arabic_quran_data: data }));
  }

  updateSubjectExclusions(data: SubjectExclusionData): void {
    this.state.update(s => ({ ...s, subject_exclusions: data }));
  }

  updateMedical(data: MedicalRecord): void {
    this.state.update(s => ({ ...s, medical_record: data }));
  }

  updateCarersFamily(data: { carers: CarerData[]; family_background: FamilyBackground | null; siblings: SiblingFormEntry[] }): void {
    this.state.update(s => ({ ...s, carers: data.carers, family_background: data.family_background || undefined, siblings: data.siblings }));
  }

  onStepChange(event: any): void {
    this.submitError.set(null);
  }

  buildPayload(): AdmissionCreatePayload {
    const s = this.state();
    const payload: AdmissionCreatePayload = {
      first_name: s.first_name, last_name: s.last_name,
      date_of_birth: s.date_of_birth, gender: s.gender,
      religion: s.religion, nationality: s.nationality, residence: s.residence,
      year_level_id: s.year_level_id, date_of_admission: s.date_of_admission,
      pathway: s.pathway,
      medical_record: s.medical_record,
      carers: s.carers,
      siblings: s.siblings || [],
    };
    if (s.family_background) payload.family_background = s.family_background;
    if (s.arabic_quran_data) payload.arabic_quran_data = s.arabic_quran_data;
    if (s.subject_exclusions) payload.subject_exclusions = s.subject_exclusions;

    switch (s.pathway) {
      case 'REGULAR_SCHOOL':
        payload.regular_details = s.regular_details as RegularSchoolDetails;
        break;
      case 'REGULAR_SCHOOL_INTERRUPTED':
        payload.regular_details = s.regular_details as RegularSchoolInterruptDetails;
        break;
      case 'HOMESCHOOL':
        payload.homeschool_details = s.homeschool_details;
        break;
      case 'NONE':
        payload.none_education_details = s.none_education_details;
        break;
    }
    return payload;
  }

  onSubmit(): void {
    this.isSubmitting.set(true);
    this.submitError.set(null);
    const payload = this.buildPayload();

    this.studentsService.createAdmission(payload).subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        this.snackBar.open(`Admission created: ${result.admission_number}`, 'Close', { duration: 5000 });
        if (this.inDialog()) {
          this.wizardClosed.emit(true);
        } else {
          this.router.navigate(['/portalAdmin/students/admissions']);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || err.error?.detail || 'Failed to create admission. Please check all fields.';
        this.submitError.set(msg);
      },
    });
  }

  goBack(): void {
    if (this.inDialog()) {
      this.wizardClosed.emit(false);
    } else {
      this.router.navigate(['/portalAdmin/students/admissions']);
    }
  }
}
