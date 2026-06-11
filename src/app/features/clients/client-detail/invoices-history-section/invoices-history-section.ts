import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { map } from 'rxjs/operators';

import { InvoicesTableComponent } from '@app/features/invoices/invoices-table/invoices-table.component';
import { ClientsService } from '@app/services/clients.service';

import type { InvoiceResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-invoices-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InvoicesTableComponent],
  templateUrl: './invoices-history-section.html',
  styleUrl: './invoices-history-section.scss',
})
export class InvoicesHistorySectionComponent {
  readonly clientId = input.required<string>();

  private readonly clientsService = inject(ClientsService);

  private readonly invoicesData = rxResource<InvoiceResponseDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) =>
      this.clientsService.getInvoices(params, { page: 1, limit: 20 }).pipe(map((r) => r.items)),
  });

  readonly invoices = computed(() => this.invoicesData.value() ?? []);
  readonly loading = computed(() => this.invoicesData.isLoading());
}
