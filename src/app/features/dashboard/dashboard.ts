import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';

import { DashboardService } from '@app/services/dashboard.service';
import { MeService } from '@app/services/me.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';

/** Lead status labels and colors for pipeline chart. */
const LEAD_STATUS_CONFIG = [
  { key: 'NEW', label: 'Новый', color: '#5b9aa9' },
  { key: 'ASSIGNED', label: 'Назначен', color: '#8b7a9c' },
  { key: 'IN_PROGRESS', label: 'В работе', color: '#c89a5e' },
  { key: 'OFFER_SENT', label: 'Отправлено КП', color: '#6b8591' },
  { key: 'WON', label: 'Выигран', color: '#5d9c71' },
  { key: 'LOST', label: 'Проигран', color: '#8b8f92' },
  { key: 'EXPIRED', label: 'Истёк', color: '#a86565' },
] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  imports: [RouterLink, MatTableModule, MatIconModule, NgClass, PageHeading, ...MAT_BUTTONS],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly meService = inject(MeService);
  private readonly router = inject(Router);

  private refreshIntervalId?: ReturnType<typeof setInterval>;

  readonly loading = signal(true);
  readonly error = signal<string | undefined>(undefined);
  readonly stats = signal<{
    leadsToday?: number;
    leadsTotal?: number;
    activeOffers?: number;
    expiringOffersThisWeek?: number;
    overdueInvoicesCount?: number;
    overdueInvoicesAmount?: number;
    overdueInvoicesCurrency?: string;
    leadsByStatus?: Record<string, number>;
    stalledLeads?: {
      id?: string;
      number?: string;
      clientName?: string;
      destination?: string;
      daysSinceUpdate?: number;
      assignedAgentName?: string;
    }[];
    upcomingDepartures?: {
      id?: string;
      number?: string;
      clientName?: string;
      destination?: string;
      departDate?: string;
    }[];
  } | null>(null);

  readonly greeting = computed(() => {
    const meData = this.meService.getMeData();
    const fullName = meData?.fullName ?? 'Пользователь';

    return `Добрый день, ${fullName}!`;
  });

  readonly currentDateFormatted = computed(() => {
    const today = new Date();
    const formatted = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(today);

    return formatted;
  });

  readonly overdueAmount = computed(() => {
    const s = this.stats();

    if (!s?.overdueInvoicesAmount) {
      return '0,00';
    }

    const amount = s.overdueInvoicesAmount;
    const formatted = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return formatted;
  });

  readonly overdueInvoicesText = computed(() => {
    const count = this.stats()?.overdueInvoicesCount ?? 0;

    return this.getInvoicePluralForm(count);
  });

  readonly pipelineChartData = computed(() => {
    const leadsByStatus = this.stats()?.leadsByStatus ?? {};
    const totalLeads =
      LEAD_STATUS_CONFIG.reduce((sum, s) => sum + (leadsByStatus[s.key] ?? 0), 0) || 1;

    return LEAD_STATUS_CONFIG.map((status, index) => {
      const cumulativeValue = LEAD_STATUS_CONFIG.slice(index).reduce(
        (sum, s) => sum + (leadsByStatus[s.key] ?? 0),
        0,
      );

      return {
        key: status.key,
        label: status.label,
        color: status.color,
        value: cumulativeValue,
        widthPercent: (cumulativeValue / totalLeads) * 100,
      };
    });
  });

  readonly stalledLeads = computed(() => this.stats()?.stalledLeads ?? []);
  readonly upcomingDepartures = computed(() => this.stats()?.upcomingDepartures ?? []);

  readonly stalledLeadsColumns = ['clientName', 'destination', 'agentName', 'daysSinceUpdate'];
  readonly departuresColumns = ['number', 'clientName', 'destination', 'departDate'];

  constructor() {
    effect(() => {
      this.loadDashboard();
    });

    this.refreshIntervalId = setInterval(
      () => {
        this.loadDashboard();
      },
      5 * 60 * 1000,
    );
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId !== undefined) {
      clearInterval(this.refreshIntervalId);
    }
  }

  protected navigateFromCard(card: 'leads' | 'offers' | 'overdue'): void {
    if (card === 'leads') {
      this.router.navigate(['/app/leads'], { queryParams: { createdToday: true } });
    }

    if (card === 'offers') {
      this.router.navigate(['/app/offers'], { queryParams: { status: 'SENT' } });
    }

    if (card === 'overdue') {
      this.router.navigate(['/app/invoices'], { queryParams: { status: 'OVERDUE' } });
    }
  }

  protected navigateFromPipelineBar(statusKey: string): void {
    this.router.navigate(['/app/leads'], { queryParams: { status: statusKey } });
  }

  protected navigateToStalledLead(leadId?: string): void {
    if (leadId) {
      this.router.navigate(['/app/leads', leadId]);
    }
  }

  protected navigateToBooking(bookingId?: string): void {
    if (bookingId) {
      this.router.navigate(['/app/bookings', bookingId]);
    }
  }

  protected getDaysStalledClass(days?: number): string {
    const d = days ?? 0;

    return d > 5 ? 'text-red-700 font-bold' : '';
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.dashboardService.get().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        let errorMessage = 'Failed to load dashboard';

        if (err instanceof HttpErrorResponse) {
          errorMessage = err.error?.message ?? err.message ?? errorMessage;
        }

        this.error.set(errorMessage);
        this.loading.set(false);
      },
    });
  }

  private getInvoicePluralForm(count: number): string {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return `${count} счётов`;
    }

    if (lastDigit === 1) {
      return `${count} счёт`;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${count} счёта`;
    }

    return `${count} счётов`;
  }
}
