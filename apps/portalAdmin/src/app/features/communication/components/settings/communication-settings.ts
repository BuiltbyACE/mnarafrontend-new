import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommunicationService } from '../../services/communication.service';

@Component({
  selector: 'app-communication-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTableModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <div class="title-section">
          <h1>Communication Settings</h1>
          <p class="subtitle">Configure gateways, templates, and automation rules.</p>
        </div>
      </header>

      <mat-tab-group class="settings-tabs" animationDuration="300ms">
        <!-- ═══ TAB 1: API GATEWAYS ═══ -->
        <mat-tab label="API Gateways">
          <ng-template matTabContent>
            <div class="gateways-grid">
              <mat-card class="gateway-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>sms</mat-icon>
                  <mat-card-title>SMS Configuration</mat-card-title>
                  <mat-card-subtitle>Africa's Talking integration</mat-card-subtitle>
                </mat-card-header>
                <mat-divider />
                <mat-card-content>
                  <form [formGroup]="smsForm" class="gateway-form">
                    <div class="form-field">
                      <label class="input-label">Provider</label>
                      <input formControlName="provider" />
                    </div>
                    <div class="form-field">
                      <label class="input-label">API Key</label>
                      <input formControlName="apiKey" type="password" />
                    </div>
                  </form>
                </mat-card-content>
                <mat-divider />
                <mat-card-actions>
                  <button mat-stroked-button color="primary">
                    <mat-icon>wifi_tethering</mat-icon>
                    Test Connection
                  </button>
                  <button mat-flat-button color="primary">Save Changes</button>
                </mat-card-actions>
              </mat-card>

              <mat-card class="gateway-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>email</mat-icon>
                  <mat-card-title>Email (SMTP) Configuration</mat-card-title>
                  <mat-card-subtitle>Transactional email relay</mat-card-subtitle>
                </mat-card-header>
                <mat-divider />
                <mat-card-content>
                  <form [formGroup]="emailForm" class="gateway-form">
                    <div class="form-field">
                      <label class="input-label">SMTP Host</label>
                      <input formControlName="host" />
                    </div>
                    <div class="form-field">
                      <label class="input-label">SMTP Port</label>
                      <input formControlName="port" type="number" />
                    </div>
                    <div class="form-field">
                      <label class="input-label">Username</label>
                      <input formControlName="username" />
                    </div>
                    <div class="form-field">
                      <label class="input-label">Password</label>
                      <input formControlName="password" type="password" />
                    </div>
                  </form>
                </mat-card-content>
                <mat-divider />
                <mat-card-actions>
                  <button mat-stroked-button color="primary">
                    <mat-icon>wifi_tethering</mat-icon>
                    Test Connection
                  </button>
                  <button mat-flat-button color="primary">Save Changes</button>
                </mat-card-actions>
              </mat-card>
            </div>
          </ng-template>
        </mat-tab>

        <!-- ═══ TAB 2: MESSAGE TEMPLATES ═══ -->
        <mat-tab label="Message Templates">
          <ng-template matTabContent>
            <div class="templates-panel">
              <div class="templates-toolbar">
                <span class="template-count">{{ templates().length }} templates</span>
                <button mat-flat-button color="primary">
                  <mat-icon>add</mat-icon>
                  Create Template
                </button>
              </div>
              <mat-card class="table-card">
                <mat-card-content>
                  @if (templates().length > 0) {
                    <div class="table-container">
                      <table mat-table [dataSource]="templates()">
                        <ng-container matColumnDef="code">
                          <th mat-header-cell *matHeaderCellDef>Code</th>
                          <td mat-cell *matCellDef="let t">
                            <code class="code-badge">{{ t.code }}</code>
                          </td>
                        </ng-container>
                        <ng-container matColumnDef="name">
                          <th mat-header-cell *matHeaderCellDef>Name</th>
                          <td mat-cell *matCellDef="let t">{{ t.name }}</td>
                        </ng-container>
                        <ng-container matColumnDef="subject_template">
                          <th mat-header-cell *matHeaderCellDef>Subject</th>
                          <td mat-cell *matCellDef="let t" class="mono">{{ t.subject_template }}</td>
                        </ng-container>
                        <ng-container matColumnDef="actions">
                          <th mat-header-cell *matHeaderCellDef>Actions</th>
                          <td mat-cell *matCellDef="let t">
                            <button mat-icon-button matTooltip="Edit template">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button mat-icon-button matTooltip="Delete template">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="templateColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: templateColumns;"></tr>
                      </table>
                    </div>
                  } @else {
                    <div class="empty-state">
                      <mat-icon>description</mat-icon>
                      <p>No templates yet</p>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </ng-template>
        </mat-tab>

        <!-- ═══ TAB 3: AUTOMATION RULES ═══ -->
        <mat-tab label="Automation Rules">
          <ng-template matTabContent>
            <div class="automation-panel">
              <mat-card class="rule-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>notifications_active</mat-icon>
                  <mat-card-title>Absentee SMS Alerts</mat-card-title>
                  <mat-card-subtitle>
                    Auto-send absentee SMS to parents by 9:00 AM
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <mat-slide-toggle
                    [checked]="gatewayConfig().autoAttendanceAlerts"
                    (change)="toggleAttendanceAlerts()"
                    color="primary">
                    {{ gatewayConfig().autoAttendanceAlerts ? 'Enabled' : 'Disabled' }}
                  </mat-slide-toggle>
                </mat-card-content>
              </mat-card>

              <mat-card class="rule-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>escalator_warning</mat-icon>
                  <mat-card-title>Critical Ticket Escalation</mat-card-title>
                  <mat-card-subtitle>
                    Automatically escalate unread critical support tickets after 2 hours
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <mat-slide-toggle checked color="primary">Enabled</mat-slide-toggle>
                </mat-card-content>
              </mat-card>

              <mat-card class="rule-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>reply_all</mat-icon>
                  <mat-card-title>Two-Way SMS Replies</mat-card-title>
                  <mat-card-subtitle>
                    Enable inbound SMS reply processing for broadcast campaigns
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <mat-slide-toggle color="primary">Disabled</mat-slide-toggle>
                </mat-card-content>
              </mat-card>

              <mat-card class="rule-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>payments</mat-icon>
                  <mat-card-title>Auto Fee Reminders</mat-card-title>
                  <mat-card-subtitle>
                    Send fee reminder broadcasts every Monday at 8:00 AM
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <mat-slide-toggle
                    [checked]="gatewayConfig().autoFeeReminders"
                    (change)="toggleFeeReminders()"
                    color="primary">
                    {{ gatewayConfig().autoFeeReminders ? 'Enabled' : 'Disabled' }}
                  </mat-slide-toggle>
                </mat-card-content>
              </mat-card>
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .settings-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .title-section h1 { margin: 0 0 2px; font-size: 24px; font-weight: 700; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .settings-tabs { min-height: 400px; }

    /* ── Tab 1: API Gateways ── */
    .gateways-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px 0; }
    .gateway-card { border-radius: 12px; }
    .gateway-card mat-card-header { padding-top: 16px; }
    .gateway-card mat-card-avatar { color: #6366f1; }
    .gateway-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 16px; }
    .gateway-card mat-card-actions {
      display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px;
    }

    /* ── Tab 2: Templates ── */
    .templates-panel { padding: 24px 0; display: flex; flex-direction: column; gap: 16px; }
    .templates-toolbar {
      display: flex; align-items: center; justify-content: space-between;
    }
    .template-count { font-size: 0.85rem; color: #6b7280; }
    .table-card { border-radius: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .code-badge {
      background: #eef2ff; color: #4f46e5; padding: 2px 8px;
      border-radius: 4px; font-size: 0.8rem; font-weight: 600;
    }
    .mono { font-family: 'Courier New', monospace; font-size: 0.82rem; color: #374151; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; color: #9ca3af;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .mat-mdc-row .mat-mdc-cell { padding: 8px 16px; }

    /* ── Tab 3: Automation ── */
    .automation-panel { display: grid; gap: 16px; padding: 24px 0; }
    .rule-card { border-radius: 12px; }
    .rule-card mat-card-header { padding-top: 16px; }
    .rule-card mat-card-avatar { color: #6366f1; }
    .rule-card mat-card-content { padding: 0 16px 16px; }
    .rule-card mat-slide-toggle { margin-top: 4px; }

    @media (max-width: 800px) {
      .gateways-grid { grid-template-columns: 1fr; }
    }
  `,
  `
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .form-field input,
    .form-field select,
    .form-field textarea {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      color: #1f2937;
      background: #fff;
      transition: border-color 0.15s;
      box-sizing: border-box;
      font-family: inherit;
    }
    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
    }
    .form-field select {
      cursor: pointer;
    }
    .input-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 2px;
    }
    .error-text {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 4px;
    }
  `],
})
export class CommunicationSettingsComponent implements OnInit {
  private communicationService = inject(CommunicationService);
  private fb = inject(FormBuilder);

  readonly templates = this.communicationService.templates.asReadonly();
  readonly gatewayConfig = this.communicationService.gatewayConfig.asReadonly();

  readonly templateColumns = ['code', 'name', 'subject_template', 'actions'];

  smsForm = this.fb.group({
    provider: ['AfricasTalking', Validators.required],
    apiKey: ['', Validators.required],
  });

  emailForm = this.fb.group({
    host: ['smtp.mailgun.org', Validators.required],
    port: [587, [Validators.required, Validators.min(1)]],
    username: ['postmaster@mnara.school', Validators.required],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    this.communicationService.loadTemplates();
    this.communicationService.loadGatewayConfig();
  }

  toggleFeeReminders(): void {
    this.communicationService.gatewayConfig.update((c) => ({
      ...c,
      autoFeeReminders: !c.autoFeeReminders,
    }));
  }

  toggleAttendanceAlerts(): void {
    this.communicationService.gatewayConfig.update((c) => ({
      ...c,
      autoAttendanceAlerts: !c.autoAttendanceAlerts,
    }));
  }
}
