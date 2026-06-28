import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TimetableApiService, Room } from '@sms/domain/timetable';

const ROOM_TYPES = [
  'CLASSROOM', 'LAB', 'HALL', 'LIBRARY', 'ICT_LAB',
  'ART_STUDIO', 'MUSIC_ROOM', 'PLAYGROUND', 'FIELD', 'OTHER',
] as const;

const ROOM_TYPE_ICONS: Record<string, string> = {
  CLASSROOM:  'meeting_room',
  LAB:        'science',
  HALL:       'apartment',
  LIBRARY:    'local_library',
  ICT_LAB:    'computer',
  ART_STUDIO: 'palette',
  MUSIC_ROOM: 'music_note',
  PLAYGROUND: 'sports_soccer',
  FIELD:      'terrain',
  OTHER:      'room',
};

@Component({
  selector: 'app-rooms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="p-6 max-w-[1200px] mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Rooms</h1>
          <p class="text-sm text-slate-500 mt-1">Manage classrooms, labs, halls and other teaching spaces</p>
        </div>
        <button mat-flat-button color="primary" (click)="startCreate()">
          <mat-icon class="text-base mr-1">add</mat-icon>
          Add Room
        </button>
      </div>

      <!-- Search / Filter bar -->
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <mat-form-field appearance="outline" class="w-56" subscriptSizing="dynamic">
          <mat-label>Search rooms</mat-label>
          <input matInput [(ngModel)]="searchQuery" placeholder="Name or building…" />
          <mat-icon matPrefix fontSet="material-icons-outlined" class="text-slate-400">search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-44" subscriptSizing="dynamic">
          <mat-label>Room Type</mat-label>
          <mat-select [(ngModel)]="filterType">
            <mat-option [value]="''">All Types</mat-option>
            @for (t of roomTypes; track t) {
              <mat-option [value]="t">{{ t.replace('_', ' ') }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (searchQuery() || filterType()) {
          <button mat-stroked-button (click)="clearFilters()" class="text-sm">
            <mat-icon class="text-sm">close</mat-icon>
            Clear
          </button>
        }
        <span class="text-xs text-slate-400 ml-auto">
          {{ filteredRooms().length }} of {{ rooms().length }} rooms
        </span>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="grid grid-cols-1 gap-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-16 rounded-xl bg-slate-100 animate-pulse"></div>
          }
        </div>
      }

      <!-- Error -->
      @if (errorMsg()) {
        <div class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700 mb-4">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0">error_outline</mat-icon>
          {{ errorMsg() }}
        </div>
      }

      <!-- Inline form -->
      @if (showForm()) {
        <div class="mb-6 p-5 rounded-2xl border border-primary/30 bg-primary/[0.03]">
          <h3 class="text-sm font-semibold text-slate-800 mb-4">
            {{ editingId() ? 'Edit Room' : 'New Room' }}
          </h3>
          <form [formGroup]="form" (ngSubmit)="save()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Room Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Lab 1" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Room Type</mat-label>
              <mat-select formControlName="room_type">
                @for (t of roomTypes; track t) {
                  <mat-option [value]="t">{{ t.replace('_', ' ') }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Capacity</mat-label>
              <input matInput type="number" formControlName="capacity" placeholder="30" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Building</mat-label>
              <input matInput formControlName="building" placeholder="Science Block" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Floor</mat-label>
              <input matInput type="number" formControlName="floor" placeholder="1" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Notes</mat-label>
              <input matInput formControlName="notes" placeholder="Optional notes" />
            </mat-form-field>
            <div class="flex items-end gap-2 col-span-full">
              <button type="submit" mat-flat-button color="primary" [disabled]="saving() || form.invalid">
                {{ saving() ? 'Saving…' : (editingId() ? 'Update' : 'Create') }}
              </button>
              <button type="button" mat-stroked-button (click)="cancelForm()">Cancel</button>
              @if (savingError()) {
                <span class="text-sm text-red-600 ml-2">{{ savingError() }}</span>
              }
            </div>
          </form>
        </div>
      }

      <!-- Room list -->
      @if (!loading() && filteredRooms().length > 0) {
        <div class="overflow-x-auto rounded-2xl border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 font-semibold text-slate-600">Room</th>
                <th class="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                <th class="text-center px-4 py-3 font-semibold text-slate-600">Capacity</th>
                <th class="text-left px-4 py-3 font-semibold text-slate-600">Building</th>
                <th class="text-center px-4 py-3 font-semibold text-slate-600">Floor</th>
                <th class="text-center px-4 py-3 font-semibold text-slate-600">Active</th>
                <th class="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (r of filteredRooms(); track r.id) {
                <tr class="hover:bg-slate-50/50 transition-colors duration-150"
                    [class.opacity-50]="!r.is_active">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <mat-icon class="text-sm">{{ roomTypeIcon(r.room_type) }}</mat-icon>
                      </div>
                      <span class="font-medium text-slate-800">{{ r.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      <mat-icon class="text-[11px]">{{ roomTypeIcon(r.room_type) }}</mat-icon>
                      {{ r.room_type.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    @if (r.capacity) {
                      <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold min-w-[2rem]">
                        {{ r.capacity }}
                      </span>
                    } @else {
                      <span class="text-slate-300">—</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ r.building || '—' }}</td>
                  <td class="px-4 py-3 text-center text-slate-600">{{ r.floor ?? '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <mat-slide-toggle [checked]="r.is_active"
                                      (change)="toggleActive(r)"
                                      [matTooltip]="r.is_active ? 'Deactivate' : 'Activate'"
                                      color="primary">
                    </mat-slide-toggle>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button mat-icon-button (click)="startEdit(r)" matTooltip="Edit">
                      <mat-icon fontSet="material-icons-outlined" class="text-base">edit</mat-icon>
                    </button>
                    <button mat-icon-button (click)="confirmDelete(r)" matTooltip="Delete">
                      <mat-icon fontSet="material-icons-outlined" class="text-base text-red-400 hover:text-red-600">delete_outline</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !errorMsg() && filteredRooms().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <mat-icon fontSet="material-icons-outlined" class="text-3xl text-slate-400">meeting_room</mat-icon>
          </div>
          @if (rooms().length === 0) {
            <h3 class="text-base font-semibold text-slate-700">No rooms configured</h3>
            <p class="text-sm text-slate-400 mt-1">Add classrooms, labs and halls to assign timetable entries.</p>
            <button mat-flat-button color="primary" class="mt-6" (click)="startCreate()">
              <mat-icon class="text-base mr-1">add</mat-icon>
              Add First Room
            </button>
          } @else {
            <h3 class="text-base font-semibold text-slate-700">No rooms match your search</h3>
            <p class="text-sm text-slate-400 mt-1">Try adjusting your search or filter.</p>
            <button mat-stroked-button class="mt-6" (click)="clearFilters()">
              <mat-icon class="text-sm">close</mat-icon>
              Clear Filters
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class RoomsPage implements OnInit {
  private api = inject(TimetableApiService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  protected roomTypes = ROOM_TYPES;
  protected rooms = signal<Room[]>([]);
  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);
  protected showForm = signal(false);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);
  protected savingError = signal<string | null>(null);

  protected searchQuery = signal('');
  protected filterType = signal('');

  protected filteredRooms = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.filterType();
    return this.rooms().filter((r) => {
      if (query && !r.name.toLowerCase().includes(query) && !(r.building?.toLowerCase().includes(query))) {
        return false;
      }
      if (type && r.room_type !== type) return false;
      return true;
    });
  });

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.filterType.set('');
  }

  protected form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    room_type: ['CLASSROOM' as string, Validators.required],
    capacity: [null as number | null],
    building: [''],
    floor: [null as number | null],
    notes: [''],
  });

  readonly ROOM_TYPE_ICONS = ROOM_TYPE_ICONS;

  protected roomTypeIcon(type: string): string {
    return ROOM_TYPE_ICONS[type] ?? 'room';
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  private loadRooms(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.getRooms().subscribe({
      next: (list) => { this.rooms.set(list); this.loading.set(false); },
      error: (err) => { this.errorMsg.set(`Failed to load rooms (${err.status})`); this.loading.set(false); },
    });
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', room_type: 'CLASSROOM', capacity: null, building: '', floor: null, notes: '' });
    this.savingError.set(null);
    this.showForm.set(true);
  }

  protected startEdit(r: Room): void {
    this.editingId.set(r.id);
    this.form.patchValue(r);
    this.savingError.set(null);
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
    this.savingError.set(null);
  }

  protected save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.savingError.set(null);
    const data = this.form.getRawValue();
    const obs$ = this.editingId()
      ? this.api.updateRoom(this.editingId()!, data)
      : this.api.createRoom(data);
    obs$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadRooms();
      },
      error: (err) => {
        this.saving.set(false);
        this.savingError.set(err.error?.detail ?? err.error?.name?.[0] ?? `Save failed (${err.status})`);
      },
    });
  }

  protected toggleActive(r: Room): void {
    this.api.updateRoom(r.id, { is_active: !r.is_active }).subscribe({
      next: () => this.loadRooms(),
      error: (err) => alert(err.error?.detail ?? `Update failed (${err.status})`),
    });
  }

  protected confirmDelete(r: Room): void {
    const ok = confirm(`Delete "${r.name}"? This cannot be undone.`);
    if (!ok) return;
    this.api.deleteRoom(r.id).subscribe({
      next: () => this.loadRooms(),
      error: (err) => alert(err.error?.detail ?? `Delete failed (${err.status})`),
    });
  }
}
