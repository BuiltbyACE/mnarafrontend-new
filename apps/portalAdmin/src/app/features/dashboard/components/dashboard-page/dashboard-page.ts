/**
 * Admin Dashboard Page
 * Pixel-Perfect clone of reference UI with live data
 */

import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';
import { RecentActivitiesService } from '../../../../core/services/recent-activities.service';
import { CalendarService } from '../../../../core/services/calendar.service';
import { AuthStore } from '@sms/core/auth';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, BaseChartDirective],
  templateUrl: './dashboard-page.html'
})
export class DashboardPageComponent implements OnInit {
  // Services
  dashboardService = inject(AdminDashboardService);
  activitiesService = inject(RecentActivitiesService);
  calendarService = inject(CalendarService);
  authStore = inject(AuthStore);
  router = inject(Router);

  // Data signals
  dashboard = this.dashboardService.dashboardData;
  activities = this.activitiesService.activities;
  calendarEvents = this.calendarService.events;
  currentMonth = this.calendarService.currentMonth;
  currentYear = this.calendarService.currentYear;

  // User info for welcome banner
  userName = this.authStore.fullName;

  ngOnInit() {
    // Load all dashboard data
    this.dashboardService.getDashboardSummary().subscribe();
    this.activitiesService.loadActivities(5);
    this.calendarService.loadEvents();
  }

  // Chart configs
  attendanceChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, hoverRadius: 6, backgroundColor: 'white', borderWidth: 2 }
    },
    scales: {
      x: { grid: { display: false } },
      y: { min: 0, max: 100, ticks: { callback: (val) => val + '%' } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  attendanceChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const data = this.dashboard();
    return {
      labels: data?.attendance_overview?.labels || [],
      datasets: [
        {
          data: data?.attendance_overview?.data || [],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          pointBorderColor: '#2563EB'
        }
      ]
    };
  });

  feeChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    }
  };

  feeChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const data = this.dashboard();
    if (!data) return { datasets: [], labels: [] };
    
    return {
      labels: ['Collected', 'Pending', 'Overdue'],
      datasets: [
        {
          data: [
            data.fee_collection.collected_amount,
            data.fee_collection.pending_amount,
            data.fee_collection.overdue_amount
          ],
          backgroundColor: ['#2563EB', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }
      ]
    };
  });

  getAlertIconClass(type: string): string {
    switch (type) {
      case 'warning': return 'bg-orange-100 text-orange-600';
      case 'danger': return 'bg-red-100 text-red-600';
      case 'success': return 'bg-green-100 text-green-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'warning': return 'warning';
      case 'danger': return 'error';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }

  // Quick Actions navigation
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Activity helpers
  getActivityIcon(type: string): string {
    switch (type) {
      case 'student': return 'person';
      case 'staff': return 'group';
      case 'payment': return 'payment';
      case 'attendance': return 'how_to_reg';
      case 'exam': return 'event_note';
      case 'system': return 'settings';
      default: return 'circle';
    }
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'student': return 'bg-blue-50 text-blue-600';
      case 'staff': return 'bg-green-50 text-green-600';
      case 'payment': return 'bg-green-50 text-green-600';
      case 'attendance': return 'bg-orange-50 text-orange-600';
      case 'exam': return 'bg-red-50 text-red-600';
      case 'system': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  }

  // Calendar helpers
  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  }

  generateCalendarDays(): Array<{ day: number | string; date: string; class: string; hasEvent: boolean; isToday: boolean }> {
    const year = this.currentYear();
    const month = this.currentMonth();
    const events = this.calendarEvents();

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const today = new Date();
    const isCurrentMonth = today.getMonth() === month - 1 && today.getFullYear() === year;
    const todayDate = today.getDate();

    const days: Array<{ day: number | string; date: string; class: string; hasEvent: boolean; isToday: boolean }> = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month - 1, -i).getDate();
      days.unshift({ day: prevMonthDay, date: '', class: 'text-gray', hasEvent: false, isToday: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        class: '',
        hasEvent: events.some(e => e.date === dateStr),
        isToday: isCurrentMonth && day === todayDate
      });
    }

    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ day, date: '', class: 'text-gray', hasEvent: false, isToday: false });
    }

    return days;
  }
}
