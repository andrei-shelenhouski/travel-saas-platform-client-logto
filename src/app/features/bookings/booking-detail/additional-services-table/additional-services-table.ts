import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { BookingServiceSnapshotEntryDto } from '@app/shared/models';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  TRANSFER: $localize`:@@bookingServiceTypeTransfer:Transfer`,
  EXCURSION: $localize`:@@bookingServiceTypeExcursion:Excursion`,
  VISA: $localize`:@@bookingServiceTypeVisa:Visa`,
  INSURANCE: $localize`:@@bookingServiceTypeInsurance:Insurance`,
  FLIGHT: $localize`:@@bookingServiceTypeFlight:Flight`,
  OTHER: $localize`:@@bookingServiceTypeOther:Other`,
};

@Component({
  selector: 'app-additional-services-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './additional-services-table.html',
  styleUrl: './additional-services-table.scss',
})
export class AdditionalServicesTableComponent {
  readonly services = input<BookingServiceSnapshotEntryDto[] | null | undefined>(null);
  readonly currency = input<string | null | undefined>(null);

  readonly rows = computed<BookingServiceSnapshotEntryDto[]>(() => this.services() ?? []);

  serviceTypeLabel(type: string | null | undefined): string {
    if (!type) {
      return '—';
    }

    return SERVICE_TYPE_LABELS[type] ?? type;
  }
}
