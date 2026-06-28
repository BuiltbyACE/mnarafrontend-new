import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface ResourceViewerData {
  title: string;
  type: string; // 'VIDEO', 'DOCUMENT', 'LINK', etc.
  url: string;
}

@Component({
  selector: 'lib-resource-viewer',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="viewer-header">
      <div class="header-info">
        <mat-icon class="type-icon">{{ getIcon(data.type) }}</mat-icon>
        <h2 class="viewer-title">{{ data.title }}</h2>
      </div>
      <div class="header-actions">
        <a *ngIf="data.url" [href]="data.url" target="_blank" mat-stroked-button color="primary" class="new-tab-btn">
          <mat-icon>open_in_new</mat-icon>
          Open in New Tab
        </a>
        <button mat-icon-button (click)="toggleMaximize()" [title]="isMaximized ? 'Restore down' : 'Maximize'">
          <mat-icon>{{ isMaximized ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
        </button>
        <button mat-icon-button (click)="close()" title="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    
    <div class="viewer-content">
      @if (data.type === 'VIDEO') {
        <video [src]="safeUrl" controls class="viewer-media" controlsList="nodownload"></video>
      } @else if (data.type === 'LINK') {
        <iframe [src]="safeUrl" class="viewer-iframe" allowfullscreen></iframe>
      } @else if (data.url) {
        <iframe [src]="safeUrl" class="viewer-iframe" allowfullscreen></iframe>
      } @else {
        <div class="no-content">
          <mat-icon>error_outline</mat-icon>
          <p>No valid URL provided for this resource.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f8fafc;
      overflow: hidden;
    }
    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      z-index: 10;
    }
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .type-icon {
      color: #6366f1;
    }
    .viewer-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 600px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .new-tab-btn {
      border-radius: 8px;
    }
    .viewer-content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f1f5f9;
      padding: 16px;
      overflow: hidden;
    }
    .viewer-media, .viewer-iframe, .viewer-object {
      width: 100%;
      height: 100%;
      max-height: calc(100vh - 130px);
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      transition: all 0.3s ease;
    }
    ::ng-deep .maximized-dialog {
      max-width: 100vw !important;
      max-height: 100vh !important;
      width: 100vw !important;
      height: 100vh !important;
      border-radius: 0 !important;
    }
    ::ng-deep .maximized-dialog .mdc-dialog__surface {
      border-radius: 0 !important;
    }
    ::ng-deep .maximized-dialog lib-resource-viewer .viewer-media,
    ::ng-deep .maximized-dialog lib-resource-viewer .viewer-iframe,
    ::ng-deep .maximized-dialog lib-resource-viewer .viewer-object {
      max-height: calc(100vh - 80px) !important;
      border-radius: 0 !important;
      border: none !important;
    }
    .viewer-media {
      object-fit: contain;
      background: black;
    }
    .no-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #64748b;
    }
    .no-content mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceViewerComponent implements OnInit {
  readonly data: ResourceViewerData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ResourceViewerComponent>);
  private readonly sanitizer = inject(DomSanitizer);

  safeUrl: SafeResourceUrl | null = null;
  isMaximized = false;

  ngOnInit() {
    if (this.data.url) {
      this.safeUrl = this.sanitizeUrl(this.data.url);
    }
  }

  private sanitizeUrl(url: string): SafeResourceUrl | null {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        console.error('Rejected URL with unsafe protocol:', parsed.protocol);
        return null;
      }
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } catch {
      console.error('Invalid URL — resource will not be loaded');
      return null;
    }
  }

  toggleMaximize() {
    this.isMaximized = !this.isMaximized;
    if (this.isMaximized) {
      this.dialogRef.updateSize('100vw', '100vh');
      this.dialogRef.addPanelClass('maximized-dialog');
    } else {
      this.dialogRef.updateSize('90vw', '90vh');
      this.dialogRef.removePanelClass('maximized-dialog');
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'VIDEO': return 'play_circle';
      case 'TEXTBOOK': return 'menu_book';
      case 'COURSEBOOK': return 'auto_stories';
      case 'DOCUMENT': return 'article';
      case 'LINK': return 'link';
      case 'SLIDES': return 'slideshow';
      default: return 'description';
    }
  }

  close() {
    this.dialogRef.close();
  }
}
