import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';

export type PersonRow = {
  id: string;
  fullName: string;
  type?: 'CLIENT' | 'DEPENDANT';
  relation?: string;
  relationInactive?: boolean;
  dateOfBirth?: string;
  documentExpiryStatus?: 'OK' | 'EXPIRING' | 'EXPIRED' | 'NONE';
  nearestExpiry?: string;
  linkedClientId?: string;
  linkedClientName?: string;
};

type PersonColumn =
  | 'name'
  | 'type'
  | 'relation'
  | 'linkedClient'
  | 'dateOfBirth'
  | 'documents'
  | 'actions';

const ALL_COLUMNS: PersonColumn[] = [
  'name',
  'type',
  'relation',
  'linkedClient',
  'dateOfBirth',
  'documents',
  'actions',
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-persons-table',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './persons-table.component.html',
  styleUrl: './persons-table.component.scss',
  host: {
    class: 'table-wrap',
  },
})
export class PersonsTableComponent {
  private readonly router = inject(Router);

  readonly persons = input<PersonRow[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input(false);
  readonly emptyMessage = input('Туристы не найдены.');
  readonly showEmptyState = input(true);
  readonly showClearFiltersAction = input(false);
  readonly showClientsLink = input(false);

  readonly clearFiltersRequest = output<void>();

  protected readonly displayedColumns = computed<PersonColumn[]>(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  protected navigateToPerson(id: string): void {
    void this.router.navigate(['/app/persons', id]);
  }

  protected navigateToClient(event: Event, clientId: string): void {
    event.stopPropagation();
    void this.router.navigate(['/app/clients', clientId]);
  }

  protected onRowKeydown(event: KeyboardEvent, id: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.navigateToPerson(id);
  }

  protected docStatusIcon(row: PersonRow): string {
    switch (row.documentExpiryStatus) {
      case 'OK':
        return 'check_circle';
      case 'EXPIRING':
        return 'warning';
      case 'EXPIRED':
        return 'cancel';
      default:
        return '';
    }
  }

  protected docStatusColor(row: PersonRow): string {
    switch (row.documentExpiryStatus) {
      case 'OK':
        return 'text-green-600';
      case 'EXPIRING':
        return 'text-amber-500';
      case 'EXPIRED':
        return 'text-red-600';
      default:
        return '';
    }
  }

  protected docStatusTooltip(row: PersonRow): string {
    switch (row.documentExpiryStatus) {
      case 'OK':
        return 'Документы в порядке';
      case 'EXPIRING':
        return `Истекает: ${row.nearestExpiry ?? ''}`;
      case 'EXPIRED':
        return `Просрочено: ${row.nearestExpiry ?? ''}`;
      default:
        return '';
    }
  }
}
