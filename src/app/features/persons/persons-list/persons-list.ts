import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';

import { debounceTime, distinctUntilChanged } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { PersonsService } from '@app/services/persons.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { PermissionKey } from '@app/shared/models';

import { CreatePersonDialogComponent } from '../create-person-dialog/create-person-dialog';
import { PersonsTableComponent } from '../persons-table/persons-table.component';

import type { PersonRow } from '../persons-table/persons-table.component';
import type { CreatePersonDialogResult } from '../create-person-dialog/create-person-dialog';
export const PAGE_SIZE = 25;

type ActiveChip = {
  label: string;
  clear: () => void;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-persons-list',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIcon,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PageHeading,
    PageHeadingAction,
    PersonsTableComponent,
    ReactiveFormsModule,
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

  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());

  protected readonly personRows = computed<PersonRow[]>(() =>
    (this.data.value()?.items ?? []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      type: p.type,
      dateOfBirth: p.date_of_birth,
      documentExpiryStatus: p.document_expiry_status,
      nearestExpiry: p.nearest_expiry,
      linkedClientId: p.linked_client?.id,
      linkedClientName: p.linked_client?.display_name,
    })),
  );

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
}
