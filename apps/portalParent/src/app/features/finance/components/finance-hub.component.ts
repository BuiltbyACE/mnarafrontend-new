import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../../services/parent-api.service';
import { FeeBalance, Transaction, STATUS_COLORS, PAYMENT_METHOD_LABEL } from '../../../models/parent.models';

@Component({
  selector: 'app-finance-hub',
  imports: [
    RouterLink, RouterOutlet, MatCardModule, MatIconModule,
    MatButtonModule, MatDividerModule, MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './finance-hub.component.html',
  styleUrls: ['./finance-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceHubComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly feeBalances = signal<FeeBalance[]>([]);
  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly STATUS_COLORS = STATUS_COLORS;
  readonly PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.api.getFeeBalances().subscribe({
      next: (balances) => {
        this.feeBalances.set(balances);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load fee data');
      },
    });

    this.api.getTransactions().subscribe({
      next: (txns) => this.transactions.set(txns.slice(0, 5)),
    });
  }

  get totalBalance(): number {
    return this.feeBalances().reduce((sum, f) => sum + f.balance, 0);
  }

  get totalDue(): number {
    return this.feeBalances().reduce((sum, f) => sum + f.total_due, 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency', currency: 'KES', maximumFractionDigits: 0,
    }).format(amount);
  }
}
