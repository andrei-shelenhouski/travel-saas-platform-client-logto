import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import type { PersonRelationshipResponseDto } from '@app/shared/models';

const RELATIONSHIP_TYPE_LABEL: Record<string, string> = {
  SPOUSE_OF: 'Супруг/супруга',
  PARENT_OF: 'Родитель/ребенок',
  SIBLING_OF: 'Брат/сестра',
  GRANDPARENT_OF: 'Бабушка/дедушка',
  OTHER: 'Другое',
};

const ALL_COLUMNS = ['type', 'relatedPerson', 'status', 'sinceDate', 'actions'] as const;

@Component({
  selector: 'app-person-relationships-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './person-relationships-table.html',
  styleUrl: './person-relationships-table.scss',
  host: { class: 'table-wrap' },
})
export class PersonRelationshipsTableComponent {
  readonly rows = input<PersonRelationshipResponseDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input(false);
  readonly relatedPersonNameById = input<Map<string, string>>(new Map());
  readonly relatedClientByPersonId = input<Map<string, string>>(new Map());

  readonly deleteRow = output<PersonRelationshipResponseDto>();
  readonly openClient = output<string>();

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  typeLabel(type: string): string {
    return RELATIONSHIP_TYPE_LABEL[type] ?? type;
  }

  statusLabel(status: string): string {
    return status === 'INACTIVE' ? 'Неактивная' : 'Активная';
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return new Date(iso).toLocaleDateString('ru-RU');
  }
}
