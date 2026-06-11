import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import type { ServiceItemDto } from '@app/shared/models';

const ALL_COLUMNS = ['serviceType', 'description', 'quantity', 'unitPrice', 'total'] as const;

@Component({
  selector: 'app-offer-services-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './offer-services-table.html',
  styleUrl: './offer-services-table.scss',
  host: { class: 'table-wrap' },
})
export class OfferServicesTableComponent {
  readonly services = input<ServiceItemDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input<boolean>(false);
  readonly currency = input<string>('');

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });
}
