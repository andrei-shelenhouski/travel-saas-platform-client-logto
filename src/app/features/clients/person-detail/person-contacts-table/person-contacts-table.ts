import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import type { PersonContactResponseDto } from '@app/shared/models';

const CONTACT_MEDIUM_LABEL: Record<string, string> = {
  PHONE: 'Телефон',
  EMAIL: 'Email',
  TELEGRAM: 'Telegram',
};

const ALL_COLUMNS = ['medium', 'value', 'primary', 'actions'] as const;

@Component({
  selector: 'app-person-contacts-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './person-contacts-table.html',
  styleUrl: './person-contacts-table.scss',
  host: { class: 'table-wrap' },
})
export class PersonContactsTableComponent {
  readonly rows = input<PersonContactResponseDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input(false);

  readonly editRow = output<PersonContactResponseDto>();
  readonly deleteRow = output<PersonContactResponseDto>();

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  mediumLabel(medium: string): string {
    return CONTACT_MEDIUM_LABEL[medium] ?? medium;
  }
}
