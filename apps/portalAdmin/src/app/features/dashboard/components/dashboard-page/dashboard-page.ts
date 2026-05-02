/**
 * Admin Dashboard Page
 * Pixel-Perfect clone of reference UI
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Header -->
      <header class="welcome-header">
        <div class="welcome-bg-watermark"></div>
        <div class="welcome-content">
          <h1>Welcome back, Admin! 👋</h1>
          <p>Here's what's happening with your institution today.</p>
        </div>
      </header>

      <!-- Top Cards Row -->
      <div class="stats-row">
        <!-- Card 1: Students -->
        <div class="stat-card">
          <div class="stat-top">
            <div class="stat-icon bg-blue-100 text-blue-600">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Students</span>
              <span class="stat-value">2,548</span>
              <span class="stat-change text-blue-600"><mat-icon>arrow_upward</mat-icon> 12.5% <span class="text-gray">from last month</span></span>
            </div>
          </div>
          <svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,25 C20,25 30,5 50,15 C70,25 80,5 100,10" fill="none" stroke="#2563EB" stroke-width="2"/>
            <path d="M0,25 C20,25 30,5 50,15 C70,25 80,5 100,10 L100,30 L0,30 Z" fill="url(#grad-blue)" opacity="0.2"/>
            <defs>
              <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2563EB" stop-opacity="1"/>
                <stop offset="100%" stop-color="#2563EB" stop-opacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Card 2: Staff -->
        <div class="stat-card">
          <div class="stat-top">
            <div class="stat-icon bg-green-100 text-green-600">
              <mat-icon>group</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Staff</span>
              <span class="stat-value">156</span>
              <span class="stat-change text-green-600"><mat-icon>arrow_upward</mat-icon> 5.3% <span class="text-gray">from last month</span></span>
            </div>
          </div>
          <svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,20 C20,20 30,10 50,15 C70,20 80,5 100,5" fill="none" stroke="#16A34A" stroke-width="2"/>
            <path d="M0,20 C20,20 30,10 50,15 C70,20 80,5 100,5 L100,30 L0,30 Z" fill="url(#grad-green)" opacity="0.2"/>
            <defs>
              <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#16A34A" stop-opacity="1"/>
                <stop offset="100%" stop-color="#16A34A" stop-opacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Card 3: Classes -->
        <div class="stat-card">
          <div class="stat-top">
            <div class="stat-icon bg-orange-100 text-orange-600">
              <mat-icon>school</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Classes</span>
              <span class="stat-value">78</span>
              <span class="stat-change text-orange-600"><mat-icon>arrow_upward</mat-icon> 8.1% <span class="text-gray">from last month</span></span>
            </div>
          </div>
          <svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,25 C20,25 30,10 50,20 C70,30 80,5 100,5" fill="none" stroke="#F59E0B" stroke-width="2"/>
            <path d="M0,25 C20,25 30,10 50,20 C70,30 80,5 100,5 L100,30 L0,30 Z" fill="url(#grad-orange)" opacity="0.2"/>
            <defs>
              <linearGradient id="grad-orange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#F59E0B" stop-opacity="1"/>
                <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Card 4: Courses -->
        <div class="stat-card">
          <div class="stat-top">
            <div class="stat-icon bg-purple-100 text-purple-600">
              <mat-icon>book</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Courses</span>
              <span class="stat-value">24</span>
              <span class="stat-change text-purple-600"><mat-icon>arrow_upward</mat-icon> 3.7% <span class="text-gray">from last month</span></span>
            </div>
          </div>
          <svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,20 C20,20 30,25 50,15 C70,5 80,15 100,10" fill="none" stroke="#9333EA" stroke-width="2"/>
            <path d="M0,20 C20,20 30,25 50,15 C70,5 80,15 100,10 L100,30 L0,30 Z" fill="url(#grad-purple)" opacity="0.2"/>
            <defs>
              <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#9333EA" stop-opacity="1"/>
                <stop offset="100%" stop-color="#9333EA" stop-opacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Card 5: Assembly -->
        <div class="assembly-card">
          <div class="assembly-content">
            <h3>School Assembly</h3>
            <p class="assembly-date">May 30, 2024 at 8:00 AM</p>
            <p class="assembly-desc">Don't forget about the upcoming school assembly.</p>
            <button class="btn-white">View Details</button>
          </div>
          <div class="assembly-icon-bg">
            <mat-icon>campaign</mat-icon>
          </div>
        </div>
      </div>

      <!-- Middle Row -->
      <div class="middle-row">
        <!-- Attendance Overview -->
        <div class="card col-span-2">
          <div class="card-header">
            <h2>Attendance Overview</h2>
            <div class="dropdown">This Month <mat-icon>expand_more</mat-icon></div>
          </div>
          <div class="chart-container">
            <svg viewBox="0 0 500 150" class="line-chart" preserveAspectRatio="none">
              <!-- Grid lines -->
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" stroke-width="1"/>
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" stroke-width="1"/>
              <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" stroke-width="1"/>
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" stroke-width="1"/>
              <line x1="0" y1="0" x2="500" y2="0" stroke="#f1f5f9" stroke-width="1"/>
              
              <!-- Y-axis labels -->
              <text x="-5" y="123" class="chart-label" text-anchor="end">0%</text>
              <text x="-5" y="93" class="chart-label" text-anchor="end">25%</text>
              <text x="-5" y="63" class="chart-label" text-anchor="end">50%</text>
              <text x="-5" y="33" class="chart-label" text-anchor="end">75%</text>
              <text x="-5" y="3" class="chart-label" text-anchor="end">100%</text>

              <!-- X-axis labels -->
              <text x="50" y="140" class="chart-label" text-anchor="middle">May 1</text>
              <text x="125" y="140" class="chart-label" text-anchor="middle">May 6</text>
              <text x="200" y="140" class="chart-label" text-anchor="middle">May 11</text>
              <text x="275" y="140" class="chart-label" text-anchor="middle">May 16</text>
              <text x="350" y="140" class="chart-label" text-anchor="middle">May 21</text>
              <text x="425" y="140" class="chart-label" text-anchor="middle">May 26</text>
              <text x="500" y="140" class="chart-label" text-anchor="middle">May 31</text>

              <!-- Main Area -->
              <path d="M0,100 C20,70 40,50 60,70 C80,90 100,100 120,80 C140,60 160,80 180,60 C200,40 220,50 240,40 C260,30 280,20 300,40 C320,60 340,80 360,70 C380,60 400,80 420,60 C440,40 460,30 480,40 C490,45 495,50 500,55 L500,120 L0,120 Z" fill="url(#grad-chart-blue)" opacity="0.2"/>
              <!-- Main Line -->
              <path d="M0,100 C20,70 40,50 60,70 C80,90 100,100 120,80 C140,60 160,80 180,60 C200,40 220,50 240,40 C260,30 280,20 300,40 C320,60 340,80 360,70 C380,60 400,80 420,60 C440,40 460,30 480,40 C490,45 495,50 500,55" fill="none" stroke="#2563EB" stroke-width="2"/>
              
              <!-- Data Points -->
              <circle cx="60" cy="70" r="4" fill="white" stroke="#2563EB" stroke-width="2"/>
              <circle cx="120" cy="80" r="4" fill="white" stroke="#2563EB" stroke-width="2"/>
              <circle cx="180" cy="60" r="4" fill="white" stroke="#2563EB" stroke-width="2"/>
              <circle cx="240" cy="40" r="4" fill="white" stroke="#2563EB" stroke-width="2"/>
              <circle cx="300" cy="40" r="6" fill="#2563EB" stroke="white" stroke-width="2"/> <!-- Active point -->
              <circle cx="360" cy="70" r="4" fill="white" stroke="#2563EB" stroke-width="2"/>
              <circle cx="420" cy="60" r="4" fill="white" stroke="#2563EB" stroke-width="2"/>
              <circle cx="480" cy="40" r="4" fill="white" stroke="#2563EB" stroke-width="2"/>

              <!-- Tooltip on active point -->
              <rect x="270" y="10" width="60" height="25" rx="4" fill="white" stroke="#e2e8f0" stroke-width="1"/>
              <text x="300" y="22" font-size="8" fill="#64748b" text-anchor="middle" font-family="Inter">May 16</text>
              <text x="300" y="32" font-size="9" fill="#1e293b" font-weight="bold" text-anchor="middle" font-family="Inter">82.4%</text>

              <defs>
                <linearGradient id="grad-chart-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2563EB" stop-opacity="1"/>
                  <stop offset="100%" stop-color="#2563EB" stop-opacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h2>Quick Actions</h2>
            <mat-icon class="icon-btn">settings</mat-icon>
          </div>
          <div class="quick-actions-grid">
            <div class="action-btn">
              <div class="action-icon bg-blue-50 text-blue-600"><mat-icon>person_add</mat-icon></div>
              <span>Add Student</span>
            </div>
            <div class="action-btn">
              <div class="action-icon bg-blue-50 text-blue-600"><mat-icon>group_add</mat-icon></div>
              <span>Add Staff</span>
            </div>
            <div class="action-btn">
              <div class="action-icon bg-blue-50 text-blue-600"><mat-icon>campaign</mat-icon></div>
              <span>Create Notice</span>
            </div>
            <div class="action-btn">
              <div class="action-icon bg-blue-50 text-blue-600"><mat-icon>assignment_ind</mat-icon></div>
              <span>Assign Class</span>
            </div>
            <div class="action-btn">
              <div class="action-icon bg-blue-50 text-blue-600"><mat-icon>fact_check</mat-icon></div>
              <span>Take Attendance</span>
            </div>
            <div class="action-btn">
              <div class="action-icon bg-blue-50 text-blue-600"><mat-icon>description</mat-icon></div>
              <span>Generate Report</span>
            </div>
          </div>
        </div>

        <!-- System Alerts -->
        <div class="card">
          <div class="card-header">
            <h2>System Alerts</h2>
            <a href="#" class="view-all">View All</a>
          </div>
          <div class="alerts-list">
            <div class="alert-item">
              <div class="alert-icon bg-orange-100 text-orange-600"><mat-icon>warning</mat-icon></div>
              <div class="alert-content">
                <h4>Fee Collection Due</h4>
                <p>128 students have pending fees</p>
              </div>
              <span class="alert-time">10m ago</span>
            </div>
            <div class="alert-item">
              <div class="alert-icon bg-blue-100 text-blue-600"><mat-icon>info</mat-icon></div>
              <div class="alert-content">
                <h4>Staff Meeting</h4>
                <p>Tomorrow at 10:00 AM in Conference Hall</p>
              </div>
              <span class="alert-time">1h ago</span>
            </div>
            <div class="alert-item">
              <div class="alert-icon bg-green-100 text-green-600"><mat-icon>check_circle</mat-icon></div>
              <div class="alert-content">
                <h4>System Update</h4>
                <p>New version available. Update now.</p>
              </div>
              <span class="alert-time">2h ago</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-row">
        <!-- Fee Collection -->
        <div class="card">
          <div class="card-header">
            <h2>Fee Collection Overview</h2>
            <div class="dropdown">This Month <mat-icon>expand_more</mat-icon></div>
          </div>
          <div class="fee-chart-area">
            <div class="donut-chart">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <!-- Background circle (Overdue) -->
                <path class="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#EF4444" stroke-width="3" stroke-dasharray="100, 100" />
                <!-- Pending circle -->
                <path class="circle-pending"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="90, 100" />
                <!-- Collected circle -->
                <path class="circle-collected"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#2563EB" stroke-width="3" stroke-dasharray="72, 100" />
              </svg>
              <div class="donut-center">
                <span class="donut-percent">72%</span>
                <span class="donut-label">Collected</span>
              </div>
            </div>
            <div class="fee-legend">
              <div class="legend-item">
                <span class="dot bg-blue-600"></span>
                <span class="legend-label">Collected</span>
                <span class="legend-val">$48,750</span>
              </div>
              <div class="legend-item">
                <span class="dot bg-orange-500"></span>
                <span class="legend-label">Pending</span>
                <span class="legend-val">$18,750</span>
              </div>
              <div class="legend-item">
                <span class="dot bg-red-500"></span>
                <span class="legend-label">Overdue</span>
                <span class="legend-val">$5,250</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Performing Classes -->
        <div class="card">
          <div class="card-header">
            <h2>Top Performing Classes</h2>
            <a href="#" class="view-all">View All</a>
          </div>
          <div class="classes-list">
            <div class="class-item">
              <div class="class-icon"><mat-icon>emoji_events</mat-icon></div>
              <div class="class-info">
                <h4>Grade 10 - A</h4>
                <p>Average: 89.5%</p>
              </div>
              <div class="class-bar-container">
                <div class="class-bar">
                  <div class="bar-fill bg-blue-600" style="width: 89.5%"></div>
                </div>
                <span class="class-score text-blue-600">89.5%</span>
              </div>
            </div>
            <div class="class-item">
              <div class="class-icon"><mat-icon>military_tech</mat-icon></div>
              <div class="class-info">
                <h4>Grade 9 - B</h4>
                <p>Average: 87.2%</p>
              </div>
              <div class="class-bar-container">
                <div class="class-bar">
                  <div class="bar-fill bg-green-500" style="width: 87.2%"></div>
                </div>
                <span class="class-score text-green-500">87.2%</span>
              </div>
            </div>
            <div class="class-item">
              <div class="class-icon"><mat-icon>workspace_premium</mat-icon></div>
              <div class="class-info">
                <h4>Grade 8 - A</h4>
                <p>Average: 85.7%</p>
              </div>
              <div class="class-bar-container">
                <div class="class-bar">
                  <div class="bar-fill bg-orange-500" style="width: 85.7%"></div>
                </div>
                <span class="class-score text-orange-500">85.7%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="card">
          <div class="card-header">
            <h2>Recent Activities</h2>
            <a href="#" class="view-all">View All</a>
          </div>
          <div class="activity-timeline">
            <div class="activity-item">
              <div class="act-icon bg-blue-50 text-blue-600"><mat-icon>person</mat-icon></div>
              <div class="act-content">
                <h4>New student admission</h4>
                <p>John Doe was added to Grade 9 - A</p>
              </div>
              <span class="act-time">10m ago</span>
            </div>
            <div class="activity-item">
              <div class="act-icon bg-green-50 text-green-600"><mat-icon>payment</mat-icon></div>
              <div class="act-content">
                <h4>Fee payment received</h4>
                <p>$250 received from Jane Smith</p>
              </div>
              <span class="act-time">1h ago</span>
            </div>
            <div class="activity-item">
              <div class="act-icon bg-orange-50 text-orange-600"><mat-icon>how_to_reg</mat-icon></div>
              <div class="act-content">
                <h4>Staff attendance marked</h4>
                <p>All staff attendance has been recorded</p>
              </div>
              <span class="act-time">2h ago</span>
            </div>
            <div class="activity-item">
              <div class="act-icon bg-red-50 text-red-600"><mat-icon>event_note</mat-icon></div>
              <div class="act-content">
                <h4>Exam schedule published</h4>
                <p>Final exam schedule is now available</p>
              </div>
              <span class="act-time">3h ago</span>
            </div>
          </div>
        </div>

        <!-- Calendar -->
        <div class="card">
          <div class="card-header">
            <h2>Calendar</h2>
            <a href="#" class="view-all">View Full Calendar</a>
          </div>
          <div class="calendar-widget">
            <div class="cal-header">
              <mat-icon>chevron_left</mat-icon>
              <span>May 2024</span>
              <mat-icon>chevron_right</mat-icon>
            </div>
            <div class="cal-grid">
              <div class="cal-day-header">Sun</div>
              <div class="cal-day-header">Mon</div>
              <div class="cal-day-header">Tue</div>
              <div class="cal-day-header">Wed</div>
              <div class="cal-day-header">Thu</div>
              <div class="cal-day-header">Fri</div>
              <div class="cal-day-header">Sat</div>
              
              <div class="cal-day text-gray">28</div>
              <div class="cal-day text-gray">29</div>
              <div class="cal-day text-gray">30</div>
              <div class="cal-day">1</div>
              <div class="cal-day">2</div>
              <div class="cal-day">3</div>
              <div class="cal-day">4</div>
              
              <div class="cal-day">5</div>
              <div class="cal-day">6</div>
              <div class="cal-day">7</div>
              <div class="cal-day">8</div>
              <div class="cal-day">9</div>
              <div class="cal-day">10</div>
              <div class="cal-day">11</div>
              
              <div class="cal-day">12</div>
              <div class="cal-day">13</div>
              <div class="cal-day">14</div>
              <div class="cal-day">15</div>
              <div class="cal-day">16</div>
              <div class="cal-day">17</div>
              <div class="cal-day">18</div>
              
              <div class="cal-day">19</div>
              <div class="cal-day">20</div>
              <div class="cal-day">21</div>
              <div class="cal-day">22</div>
              <div class="cal-day">23</div>
              <div class="cal-day">24</div>
              <div class="cal-day">25</div>
              
              <div class="cal-day">26</div>
              <div class="cal-day">27</div>
              <div class="cal-day active">28</div>
              <div class="cal-day">29</div>
              <div class="cal-day">30</div>
              <div class="cal-day">31</div>
              <div class="cal-day text-gray">1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Typography & Utilities */
    .dashboard-page {
      font-family: 'Inter', system-ui, sans-serif;
      color: #1e293b;
      max-width: 1600px;
      margin: 0 auto;
    }

    .text-gray { color: #94a3b8; }
    .bg-blue-100 { background: #dbeafe; }
    .bg-blue-50 { background: #eff6ff; }
    .text-blue-600 { color: #2563EB; }
    .bg-blue-600 { background: #2563EB; }
    
    .bg-green-100 { background: #dcfce7; }
    .bg-green-50 { background: #f0fdf4; }
    .text-green-600 { color: #16a34a; }
    .text-green-500 { color: #22c55e; }
    .bg-green-500 { background: #22c55e; }

    .bg-orange-100 { background: #ffedd5; }
    .bg-orange-50 { background: #fff7ed; }
    .text-orange-600 { color: #ea580c; }
    .text-orange-500 { color: #f97316; }
    .bg-orange-500 { background: #f97316; }

    .bg-red-50 { background: #fef2f2; }
    .text-red-600 { color: #dc2626; }

    .bg-purple-100 { background: #f3e8ff; }
    .text-purple-600 { color: #9333ea; }

    /* Welcome Header */
    .welcome-header {
      position: relative;
      margin-bottom: 24px;
      padding: 16px 0;
    }
    .welcome-bg-watermark {
      position: absolute;
      top: -20px;
      right: 0;
      width: 400px;
      height: 150px;
      background-image: url('data:image/svg+xml;utf8,<svg width="400" height="150" xmlns="http://www.w3.org/2000/svg"><path d="M200 20 L350 80 L350 150 L50 150 L50 80 Z" fill="%23f1f5f9" opacity="0.5"/><path d="M180 80 L220 80 L220 150 L180 150 Z" fill="%23e2e8f0" opacity="0.5"/></svg>');
      background-repeat: no-repeat;
      background-position: right center;
      z-index: 0;
    }
    .welcome-content {
      position: relative;
      z-index: 1;
    }
    .welcome-content h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: #0f172a;
    }
    .welcome-content p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    /* Common Card Styles */
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02);
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .card-header h2 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: #0f172a;
    }
    .dropdown {
      display: flex;
      align-items: center;
      font-size: 0.75rem;
      color: #64748b;
      background: white;
      border: 1px solid #e2e8f0;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .dropdown mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-left: 4px;
    }
    .view-all {
      font-size: 0.75rem;
      color: #2563EB;
      text-decoration: none;
      font-weight: 500;
    }
    .icon-btn {
      color: #94a3b8;
      font-size: 18px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    /* Top Cards Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      padding: 16px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 120px;
    }
    .stat-top {
      display: flex;
      gap: 12px;
    }
    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin: 2px 0;
    }
    .stat-change {
      font-size: 0.6875rem;
      display: flex;
      align-items: center;
      font-weight: 600;
    }
    .stat-change mat-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
      margin-right: 2px;
    }
    .sparkline {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 40px;
    }

    .assembly-card {
      background: #2563EB;
      border-radius: 12px;
      color: white;
      padding: 16px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    .assembly-content {
      position: relative;
      z-index: 1;
    }
    .assembly-content h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    .assembly-date {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.9);
      margin: 4px 0 8px 0;
      font-weight: 500;
    }
    .assembly-desc {
      font-size: 0.6875rem;
      color: rgba(255,255,255,0.7);
      margin: 0 0 12px 0;
      line-height: 1.4;
      max-width: 80%;
    }
    .btn-white {
      background: white;
      color: #2563EB;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      cursor: pointer;
    }
    .assembly-icon-bg {
      position: absolute;
      right: -10px;
      bottom: -10px;
      opacity: 0.2;
    }
    .assembly-icon-bg mat-icon {
      font-size: 100px;
      width: 100px;
      height: 100px;
    }

    /* Middle Row */
    .middle-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    /* Attendance Overview Line Chart */
    .chart-container {
      flex: 1;
      width: 100%;
      min-height: 200px;
      position: relative;
    }
    .line-chart {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .chart-label {
      font-size: 10px;
      fill: #94a3b8;
      font-family: 'Inter', sans-serif;
    }

    /* Quick Actions */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    .action-btn:hover .action-icon {
      transform: translateY(-2px);
    }
    .action-btn span {
      font-size: 0.6875rem;
      color: #475569;
      font-weight: 500;
      text-align: center;
    }

    /* Alerts List */
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .alert-item {
      display: flex;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .alert-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .alert-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .alert-icon mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .alert-content {
      flex: 1;
    }
    .alert-content h4 {
      margin: 0 0 2px 0;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e293b;
    }
    .alert-content p {
      margin: 0;
      font-size: 0.6875rem;
      color: #64748b;
    }
    .alert-time {
      font-size: 0.625rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    /* Bottom Row */
    .bottom-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    /* Donut Chart */
    .fee-chart-area {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
    }
    .donut-chart {
      position: relative;
      width: 120px;
      height: 120px;
    }
    .circular-chart {
      width: 100%;
      height: 100%;
    }
    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .donut-percent {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }
    .donut-label {
      font-size: 0.625rem;
      color: #64748b;
    }
    .fee-legend {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .legend-label {
      flex: 1;
      color: #475569;
    }
    .legend-val {
      font-weight: 600;
      color: #1e293b;
    }

    /* Top Classes */
    .classes-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .class-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .class-icon {
      width: 32px;
      height: 32px;
      background: #f8fafc;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #eab308;
    }
    .class-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .class-info { width: 80px; }
    .class-info h4 { margin: 0; font-size: 0.75rem; font-weight: 600; color: #1e293b; }
    .class-info p { margin: 0; font-size: 0.625rem; color: #64748b; }
    
    .class-bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .class-bar {
      flex: 1;
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
    }
    .bar-fill { height: 100%; border-radius: 3px; }
    .class-score { font-size: 0.75rem; font-weight: 600; width: 36px; text-align: right; }

    /* Recent Activities */
    .activity-timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
    }
    .activity-timeline::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 10px;
      bottom: 10px;
      width: 1px;
      background: #e2e8f0;
      z-index: 0;
    }
    .activity-item {
      display: flex;
      gap: 12px;
      position: relative;
      z-index: 1;
    }
    .act-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid white;
    }
    .act-icon mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .act-content h4 { margin: 0; font-size: 0.75rem; font-weight: 600; color: #1e293b; }
    .act-content p { margin: 2px 0 0 0; font-size: 0.6875rem; color: #64748b; }
    .act-time { font-size: 0.625rem; color: #94a3b8; margin-left: auto; }

    /* Calendar Widget */
    .calendar-widget {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e293b;
    }
    .cal-header mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #64748b;
      cursor: pointer;
    }
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      text-align: center;
    }
    .cal-day-header {
      font-size: 0.625rem;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .cal-day {
      font-size: 0.75rem;
      color: #1e293b;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
    }
    .cal-day:hover:not(.active) {
      background: #f1f5f9;
    }
    .cal-day.active {
      background: #2563EB;
      color: white;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 1400px) {
      .stats-row { grid-template-columns: repeat(3, 1fr); }
      .middle-row { grid-template-columns: 1fr; }
      .bottom-row { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class DashboardPageComponent {}
