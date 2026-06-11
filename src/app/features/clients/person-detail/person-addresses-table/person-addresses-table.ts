import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import type { PersonAddressResponseDto } from '@app/shared/models';

const ADDRESS_TYPE_LABEL: Record<string, string> = {
  REGISTRATION: 'Прописка',
  RESIDENTIAL: 'Фактический',
  OTHER: 'Другой',
};

const ALL_COLUMNS = ['type', 'country', 'city', 'street', 'postalCode', 'actions'] as const;

@Component({
  selector: 'app-person-addresses-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './person-addresses-table.html',
  styleUrl: './person-addresses-table.scss',
  host: { class: 'table-wrap' },
})
export class PersonAddressesTableComponent {
  readonly rows = input<PersonAddressResponseDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input(false);

  readonly editRow = output<PersonAddressResponseDto>();
  readonly deleteRow = output<PersonAddressResponseDto>();

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  addressLabel(type: string): string {
    return ADDRESS_TYPE_LABEL[type] ?? type;
  }
}
