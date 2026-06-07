import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { debounceTime, distinctUntilChanged } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';
import { AuthService } from '@app/auth/auth.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { MAT_BUTTONS, MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { PermissionKey } from '@app/shared/models';

import type { PersonListItemDto } from '@app/shared/models';

import {
  CreatePersonDialogComponent,
  type CreatePersonDialogResult,
} from '../create-person-dialog/create-person-dialog';

export const PAGE_SIZE = 25;

type ActiveChip = {
  label: string;
  clear: () => void;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-persons-list',
  imports: [
    ...MAT_BUTTONS,
    ...MAT_FORM_BUTTONS,
    DatePipe,
    MatChipsModule,
    MatIcon,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    PageHeading,
    PageHeadingAction,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './persons-list.html',
  styleUrl: './persons-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class PersonsListComponent {
  private readonly personsService = inject(PersonsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly PermissionKey = PermissionKey;

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly searchQuery = signal('');
  readonly typeFilter = signal<'CLIENT' | 'DEPENDANT' | null>(null);
  readonly docStatusFilter = signal<'EXPIRING' | 'EXPIRED' | null>(null);
  readonly currentPage = signal(0);

  private readonly searchValue = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  private readonly _syncSearch = effect(() => {
    const val = this.searchValue();

    if (val.length >= 2 || val.length === 0) {
      this.searchQuery.set(val);
      this.currentPage.set(0);
    }
  });

  private readonly data = rxResource({
    params: () => ({
      q: this.searchQuery(),
      type: this.typeFilter(),
      docStatus: this.docStatusFilter(),
      page: this.currentPage(),
    }),
    stream: ({ params }) => {
      const { q, type, docStatus, page } = params;

      return this.personsService.getList({
        q: q.length >= 2 ? q : undefined,
        type: type ?? undefined,
        docStatus: docStatus ?? undefined,
        page: page + 1,
        limit: PAGE_SIZE,
      });
    },
  });

  protected readonly persons = computed(() => this.data.value()?.items ?? []);
  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());

  private readonly _redirectOnForbidden = effect(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse && err.status === 403) {
      void this.router.navigate(['/app/dashboard']);
    }
  });

  protected readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        return undefined;
      }

      return err.error?.message ?? err.message ?? 'Не удалось загрузить туристов';
    }

    return undefined;
  });

  protected readonly canCreate = computed(() =>
    this.authService.hasPermission(PermissionKey.PERSONS_WRITE),
  );

  protected readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().length > 0 ||
      this.typeFilter() !== null ||
      this.docStatusFilter() !== null,
  );

  protected readonly activeChips = computed<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];

    if (this.typeFilter() === 'CLIENT') {
      chips.push({ label: 'Только клиенты', clear: () => this.typeFilter.set(null) });
    } else if (this.typeFilter() === 'DEPENDANT') {
      chips.push({ label: 'Только иждивенцы', clear: () => this.typeFilter.set(null) });
    }

    if (this.docStatusFilter() === 'EXPIRING') {
      chips.push({ label: 'Документы: истекают', clear: () => this.docStatusFilter.set(null) });
    } else if (this.docStatusFilter() === 'EXPIRED') {
      chips.push({ label: 'Документы: просрочены', clear: () => this.docStatusFilter.set(null) });
    }

    return chips;
  });

  protected readonly displayedColumns: string[] = [
    'name',
    'type',
    'linked_client',
    'date_of_birth',
    'documents',
    'actions',
  ];

  onTypeFilterChange(value: 'CLIENT' | 'DEPENDANT' | ''): void {
    this.typeFilter.set(value === '' ? null : value);
    this.currentPage.set(0);
  }

  onDocStatusFilterChange(value: 'EXPIRING' | 'EXPIRED' | ''): void {
    this.docStatusFilter.set(value === '' ? null : value);
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.searchQuery.set('');
    this.typeFilter.set(null);
    this.docStatusFilter.set(null);
    this.currentPage.set(0);
  }

  navigateToPerson(id: string): void {
    void this.router.navigate(['/app/persons', id]);
  }

  navigateToClient(event: Event, clientId: string): void {
    event.stopPropagation();
    void this.router.navigate(['/app/clients', clientId]);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<CreatePersonDialogComponent, undefined, CreatePersonDialogResult>(
      CreatePersonDialogComponent,
      {
        width: '480px',
        disableClose: false,
      },
    );

    ref.afterClosed().subscribe((result) => {
      if (result?.created) {
        this.data.reload();
      }
    });
  }

  docStatusIcon(person: PersonListItemDto): string {
    switch (person.document_expiry_status) {
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

  docStatusColor(person: PersonListItemDto): string {
    switch (person.document_expiry_status) {
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

  docStatusTooltip(person: PersonListItemDto): string {
    switch (person.document_expiry_status) {
      case 'OK':
        return 'Документы в порядке';
      case 'EXPIRING':
        return `Истекает: ${person.nearest_expiry ?? ''}`;
      case 'EXPIRED':
        return `Просрочено: ${person.nearest_expiry ?? ''}`;
      default:
        return '';
    }
  }
}
