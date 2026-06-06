import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { map } from 'rxjs/operators';

import { InvoiceStatusChipComponent } from '@app/features/invoices/invoice-status-chip/invoice-status-chip';
import { ClientsService } from '@app/services/clients.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';

import type { InvoiceResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-invoices-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MatTableModule, InvoiceStatusChipComponent, ...MAT_BUTTONS],
  templateUrl: './invoices-history-section.html',
  styleUrl: './invoices-history-section.scss',
})
export class InvoicesHistorySectionComponent {
  readonly clientId = input.required<string>();

  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);

  private readonly invoicesData = rxResource<InvoiceResponseDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) =>
      this.clientsService.getInvoices(params, { page: 1, limit: 20 }).pipe(map((r) => r.items)),
  });

  readonly invoices = computed(() => this.invoicesData.value() ?? []);
  readonly loading = computed(() => this.invoicesData.isLoading());

  readonly columns = ['number', 'invoiceDate', 'dueDate', 'status', 'total'] as const;

  formatDateShort(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }

  goToInvoice(invoice: InvoiceResponseDto): void {
    this.router.navigate(['/app/invoices', invoice.id]);
  }
}
