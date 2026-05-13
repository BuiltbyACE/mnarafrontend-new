import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClassesService } from '../classes.service';

@Component({
  selector: 'app-student-classes',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassesComponent implements OnInit {
  readonly classesService = inject(ClassesService);

  ngOnInit(): void {
    this.classesService.fetchMyClasses();
  }
}
