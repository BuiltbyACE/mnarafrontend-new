import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { TeacherResourceService } from '../../../core/services/teacher-resource.service';
import { WorkspacesService } from '../../classes/services/workspaces.service';
import type { ResourceType } from '../../../shared/models/teacher.models';

@Component({
  selector: 'app-upload-resource',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    MatCardModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatRadioModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a class="back-link" style="cursor: pointer" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> Back
          </a>
          <h1 class="page-title">Upload Resource</h1>
          <p class="page-subtitle">Add a new teaching material</p>
        </div>
      </div>

      <mat-card class="form-card">
        <form #f="ngForm" (ngSubmit)="onSubmit()" class="upload-form">
          <div class="form-section">
            <h2 class="section-title">Resource Details</h2>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="title" name="title" required #titleModel="ngModel" placeholder="e.g. Cell Biology Slides">
              @if (titleModel.invalid && titleModel.touched) {
                <mat-error>Title is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Course / Class</mat-label>
              <mat-select [(ngModel)]="courseId" name="courseId" required #courseModel="ngModel">
                @for (c of classService.workspaces(); track c.id) {
                  <mat-option [value]="c.id">{{ c.subject_name }} — {{ c.classroom_name }}</mat-option>
                }
              </mat-select>
              @if (courseModel.invalid && courseModel.touched) {
                <mat-error>Please select a class</mat-error>
              }
            </mat-form-field>

            <label class="field-label">Resource Type</label>
            <mat-radio-group [(ngModel)]="resourceType" name="resourceType" class="type-grid">
              @for (t of resourceTypes; track t.value) {
                <mat-radio-button [value]="t.value" color="primary">
                  <span class="type-option">
                    <mat-icon>{{ t.icon }}</mat-icon>
                    {{ t.label }}
                  </span>
                </mat-radio-button>
              }
            </mat-radio-group>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description (optional)</mat-label>
              <textarea matInput [(ngModel)]="description" name="description" rows="3" placeholder="Brief description of the resource..."></textarea>
            </mat-form-field>
          </div>

          <div class="form-section">
            <h2 class="section-title">File or Link</h2>

            <mat-radio-group [(ngModel)]="uploadMode" name="uploadMode" class="mode-toggle" color="primary">
              <mat-radio-button value="file" color="primary">Upload File</mat-radio-button>
              <mat-radio-button value="url" color="primary">External Link</mat-radio-button>
            </mat-radio-group>

            @if (uploadMode === 'file') {
              <div class="upload-zone">
                <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf,.docx,.ppt,.pptx,.mp4,.csv,.xlsx,.zip" class="file-input-hidden" id="fileInput">
                <label for="fileInput" class="file-label">
                  <mat-icon>cloud_upload</mat-icon>
                  @if (selectedFile) {
                    <span>{{ selectedFile.name }} ({{ (selectedFile.size / 1024 / 1024).toFixed(1) }} MB)</span>
                  } @else {
                    <div>
                      <span class="file-label-main">Click to browse</span>
                      <span class="file-label-hint">PDF, DOCX, PPT, MP4 up to 50 MB</span>
                    </div>
                  }
                </label>
              </div>
            } @else {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>External URL</mat-label>
                <input matInput [(ngModel)]="externalUrl" name="externalUrl" type="url" placeholder="https://youtube.com/watch?v=...">
              </mat-form-field>
            }
          </div>

          @if (service.error(); as err) {
            <div class="error-banner">{{ err }}</div>
          }

          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="goBack()">Cancel</button>
            <button type="submit" class="btn-submit" [disabled]="f.invalid || service.isUploading()">
              @if (service.isUploading()) {
                Uploading...
              } @else {
                <mat-icon>cloud_upload</mat-icon> Upload Resource
              }
            </button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    :host {
      --p: #2563eb; --pl: #dbeafe; --pd: #1d4ed8;
      --s: #fff; --b: #f1f5f9; --t: #1e293b; --ts: #64748b; --bo: #e2e8f0;
      display: block; min-height: 100vh; background: var(--b); font-family: 'Inter', sans-serif; padding: 24px;
    }
    .page { max-width: 720px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; color: var(--p); text-decoration: none; font-size: 13px; font-weight: 500; margin-bottom: 8px; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--t); margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: var(--ts); margin: 4px 0 0; }
    .form-card { border-radius: 12px; border: 1px solid var(--bo); padding: 32px; }
    .upload-form { display: flex; flex-direction: column; gap: 28px; }
    .form-section {}
    .section-title { font-size: 1rem; font-weight: 600; color: var(--t); margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--bo); }
    .full-width { width: 100%; }
    .field-label { font-size: 0.8125rem; font-weight: 500; color: var(--t); display: block; margin-bottom: 12px; }
    .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .type-option { display: inline-flex; align-items: center; gap: 6px; font-size: 0.875rem; }
    .type-option mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .mode-toggle { display: flex; gap: 24px; margin-bottom: 16px; }
    .upload-zone { margin-bottom: 16px; }
    .file-input-hidden { display: none; }
    .file-label {
      display: flex; align-items: center; gap: 12px; padding: 24px; border: 2px dashed var(--bo);
      border-radius: 12px; cursor: pointer; transition: all .15s; justify-content: center;
    }
    .file-label:hover { border-color: var(--p); background: var(--pl); }
    .file-label mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--p); }
    .file-label-main { display: block; font-size: 0.9375rem; font-weight: 500; color: var(--t); }
    .file-label-hint { display: block; font-size: 0.75rem; color: var(--ts); margin-top: 2px; }
    .error-banner { padding: 12px 16px; background: #fee2e2; color: #991b1b; border-radius: 8px; font-size: 0.875rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; }
    .btn-cancel { padding: 10px 24px; border: 1px solid var(--bo); border-radius: 8px; background: var(--s); color: var(--ts); font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; text-decoration: none; }
    .btn-submit { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border: none; border-radius: 8px; background: var(--p); color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s; }
    .btn-submit:hover { background: var(--pd); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .btn-submit mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadResourceComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly service = inject(TeacherResourceService);
  readonly classService = inject(WorkspacesService);

  readonly resourceTypes: { value: ResourceType; label: string; icon: string }[] = [
    { value: 'DOCUMENT', label: 'Document', icon: 'article' },
    { value: 'VIDEO', label: 'Video', icon: 'play_circle' },
    { value: 'LINK', label: 'Link', icon: 'link' },
    { value: 'SLIDES', label: 'Slides', icon: 'slideshow' },
    { value: 'TEXTBOOK', label: 'Textbook', icon: 'menu_book' },
    { value: 'COURSEBOOK', label: 'Coursebook', icon: 'menu_book' },
    { value: 'PAST_PAPER', label: 'Past Paper', icon: 'history_edu' },
  ];

  title = '';
  courseId: number | null = null;
  resourceType: ResourceType = 'DOCUMENT';
  description = '';
  uploadMode: 'file' | 'url' = 'file';
  selectedFile: File | null = null;
  externalUrl = '';

  constructor() {
    if (this.classService.workspaces().length === 0) {
      this.classService.fetchMyWorkspaces().subscribe();
    }
    this.route.queryParams.subscribe(params => {
      if (params['courseId']) {
        this.courseId = Number(params['courseId']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    if (!this.title || !this.courseId) return;

    this.service.uploadResource({
      course: this.courseId,
      title: this.title,
      resource_type: this.resourceType,
      description: this.description || undefined,
      file_attachment: this.uploadMode === 'file' ? this.selectedFile : null,
      external_url: this.uploadMode === 'url' ? this.externalUrl : undefined,
    });

    this.goBack();
  }

  goBack(): void {
    if (this.courseId) {
      this.router.navigate(['/teacher/workspace', this.courseId], { queryParams: { tab: 'resources' } });
    } else {
      this.router.navigate(['/teacher/classes']);
    }
  }
}
