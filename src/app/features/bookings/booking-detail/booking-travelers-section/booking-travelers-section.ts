import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import type { BookingTravelerResponseDto } from '@app/shared/models';
@Component({
  selector: 'app-booking-travelers-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIcon, MatTableModule],
  templateUrl: './booking-travelers-section.html',
  styleUrl: './booking-travelers-section.scss',
})
export class BookingTravelersSectionComponent {
  readonly travelers = input<BookingTravelerResponseDto[]>([]);
  readonly bookingStatus = input<string>('PENDING_CONFIRMATION');
  readonly returnDate = input<string | undefined>(undefined);
  readonly canEdit = input<boolean>(false);

  readonly columns = ['role', 'name', 'document', 'actions'];

  readonly addTravelers = output<void>();
  readonly removeTraveler = output<BookingTravelerResponseDto>();

  protected readonly leadPersonId = computed(() => {
    const rows = this.travelers();

    return rows.find((item) => item.role === 'LEAD')?.personId ?? rows[0]?.personId ?? null;
  });

  protected readonly hasExpiringDocuments = computed(() => {
    for (const traveler of this.travelers()) {
      if (this.isExpiring(traveler)) {
        return true;
      }
    }

    return false;
  });

  protected canRemove(): boolean {
    if (!this.canEdit()) {
      return false;
    }

    const status = this.bookingStatus();

    return status !== 'IN_PROGRESS' && status !== 'COMPLETED' && status !== 'CANCELLED';
  }

  protected documentLabel(traveler: BookingTravelerResponseDto): string {
    const documentType = this.snapshotValue(traveler, 'documentType') ?? 'DOC';
    const documentSeries = this.snapshotValue(traveler, 'documentSeries') ?? '';
    const documentNumberLast4 = this.snapshotValue(traveler, 'documentNumberLast4') ?? '—';
    const identityPart = `${documentType} ${documentSeries} ****${documentNumberLast4}`
      .replace(/\s+/g, ' ')
      .trim();

    if (this.isExpiring(traveler)) {
      return `${identityPart} ⚠`;
    }

    return `${identityPart} ✓`;
  }

  protected isLeadRow(traveler: BookingTravelerResponseDto): boolean {
    return traveler.role === 'LEAD' || traveler.personId === this.leadPersonId();
  }

  protected personName(traveler: BookingTravelerResponseDto): string {
    const fullName = this.snapshotValue(traveler, 'fullName');

    if (fullName) {
      return fullName;
    }

    const firstName = this.snapshotValue(traveler, 'firstName') ?? '';
    const lastName = this.snapshotValue(traveler, 'lastName') ?? '';
    const patronymic = this.snapshotValue(traveler, 'patronymic') ?? '';
    const name = [lastName, firstName, patronymic].filter(Boolean).join(' ').trim();

    if (name) {
      return name;
    }

    return traveler.personId;
  }

  private snapshotValue(traveler: BookingTravelerResponseDto, key: string): string | undefined {
    const snapshot = traveler.personSnapshot;

    if (!snapshot || typeof snapshot !== 'object') {
      return undefined;
    }

    const value = snapshot[key];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    return undefined;
  }

  protected isExpiring(traveler: BookingTravelerResponseDto): boolean {
    if ((traveler.expiryWarnings?.length ?? 0) > 0) {
      return true;
    }

    const returnDateValue = this.returnDate();
    const documentExpiryDate = this.snapshotValue(traveler, 'documentExpiryDate');
    const documentType = this.snapshotValue(traveler, 'documentType');

    if (!documentExpiryDate || !returnDateValue) {
      return false;
    }

    if (
      documentType !== 'INTL_PASSPORT' &&
      documentType !== 'NATIONAL_ID' &&
      documentType !== 'NATIONAL_PASSPORT'
    ) {
      return false;
    }

    const returnDate = new Date(returnDateValue);
    const expiryDate = new Date(documentExpiryDate);
    const sixMonthsAfterReturn = new Date(returnDate);

    sixMonthsAfterReturn.setMonth(sixMonthsAfterReturn.getMonth() + 6);

    return expiryDate <= sixMonthsAfterReturn;
  }
}
