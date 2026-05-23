import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { FleetVehicle } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-vehicle-form-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Edit Bus' : 'Register New Bus' }}</h2>
    <mat-dialog-content>
      <div class="form-layout">
        <mat-form-field appearance="outline">
          <mat-label>Registration Number</mat-label>
          <input matInput [(ngModel)]="form.registration_number" required placeholder="e.g. KCA 123T">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Capacity (seats)</mat-label>
          <input matInput type="number" [(ngModel)]="form.capacity" required placeholder="e.g. 44">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Model Info</mat-label>
          <input matInput [(ngModel)]="form.model_info" placeholder="e.g. Toyota Hiace 2024">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>VIN Number</mat-label>
          <input matInput [(ngModel)]="form.vin_number" placeholder="Vehicle identification number">
        </mat-form-field>

        <div class="toggle-row">
          <span class="toggle-label">Active</span>
          <mat-slide-toggle [(ngModel)]="form.is_active" />
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!isValid()" (click)="save()">
        {{ isEdit() ? 'Update' : 'Register' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-layout { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; min-width: 400px; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
    .toggle-label { font-size: 0.875rem; color: #334155; font-weight: 500; }
  `],
})
export class VehicleFormDialog {
  private dialogRef = inject(MatDialogRef<VehicleFormDialog>);
  readonly data: FleetVehicle | null = inject<FleetVehicle | null>(MAT_DIALOG_DATA);

  readonly isEdit = signal(!!this.data);

  readonly form = {
    registration_number: this.data?.registration_number || '',
    capacity: this.data?.capacity || 44,
    model_info: this.data?.model_info || '',
    vin_number: this.data?.vin_number || '',
    is_active: this.data?.is_active ?? true,
  };

  isValid(): boolean {
    return this.form.registration_number.trim().length > 0 && this.form.capacity > 0;
  }

  save(): void {
    if (!this.isValid()) return;
    this.dialogRef.close({
      registration_number: this.form.registration_number.trim(),
      capacity: this.form.capacity,
      model_info: this.form.model_info.trim(),
      vin_number: this.form.vin_number.trim(),
      is_active: this.form.is_active,
    });
  }
}
