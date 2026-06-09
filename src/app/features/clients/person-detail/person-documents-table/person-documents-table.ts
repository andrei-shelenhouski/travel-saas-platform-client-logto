import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import type { PersonDocumentResponseDto } from '@app/shared/models';

const DOC_TYPE_LABEL: Record<string, string> = {
  INTL_PASSPORT: 'Загранпаспорт',
  NATIONAL_PASSPORT: 'Внутренний / общегражданский паспорт',
  NATIONAL_ID: 'Национальный ID / ID-карта',
  BIRTH_CERTIFICATE: 'Свидетельство о рождении',
  OTHER: 'Другой документ',
};

const ALL_COLUMNS = ['document', 'issueDate', 'expiryDate', 'status', 'actions'] as const;

@Component({
  selector: 'app-person-documents-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './person-documents-table.html',
  styleUrl: './person-documents-table.scss',
  host: { class: 'table-wrap' },
})
export class PersonDocumentsTableComponent {
  readonly rows = input<PersonDocumentResponseDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input(false);

  readonly editRow = output<PersonDocumentResponseDto>();
  readonly deleteRow = output<PersonDocumentResponseDto>();

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  docLabel(doc: PersonDocumentResponseDto): string {
    const typeLabel = DOC_TYPE_LABEL[doc.type] ?? doc.type;
    const series = doc.series ? `${doc.series} ` : '';

    return `${typeLabel} · ${series}****${doc.numberLast4}`;
  }

  docExpiryClass(doc: PersonDocumentResponseDto): string {
    const expiryAppliesTo = new Set(['INTL_PASSPORT', 'NATIONAL_PASSPORT', 'NATIONAL_ID']);

    if (!doc.expiryDate || !expiryAppliesTo.has(doc.type)) {
      return '';
    }

    const now = new Date();
    const expiry = new Date(doc.expiryDate);
    const sixMonths = new Date();

    sixMonths.setMonth(sixMonths.getMonth() + 6);

    if (expiry < now) {
      return 'doc-expired';
    }

    if (expiry < sixMonths) {
      return 'doc-expiring';
    }

    return '';
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return new Date(iso).toLocaleDateString('ru-RU');
  }
}
