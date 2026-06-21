import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';

import { SuppliersService } from '@app/services/suppliers.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { PageContentComponent } from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import {
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_SERVICE_TYPE_LABELS,
  SupplierCategory,
} from '@app/shared/models';

import {
  SupplierContactFormDialogComponent,
  SupplierContactFormDialogData,
  SupplierContactFormDialogResult,
} from './supplier-contact-form-dialog/supplier-contact-form-dialog';

import type { SupplierContactResponse, SupplierResponse } from '@app/shared/models';

const CATEGORY_CHIP_CLASSES: Record<string, string> = {
  [SupplierCategory.DIRECT]: 'bg-green-100 text-green-800',
  [SupplierCategory.DMC]: 'bg-blue-100 text-blue-800',
  [SupplierCategory.BED_BANK]: 'bg-purple-100 text-purple-800',
  [SupplierCategory.OTA]: 'bg-orange-100 text-orange-800',
  [SupplierCategory.PACKAGE_OPERATOR]: 'bg-teal-100 text-teal-800',
  [SupplierCategory.CONSOLIDATOR]: 'bg-indigo-100 text-indigo-800',
  [SupplierCategory.OTHER]: 'bg-gray-100 text-gray-600',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-supplier-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
    PageContentComponent,
    PageHeading,
    PageHeadingAction,
  ],
  templateUrl: './supplier-detail.html',
  styleUrl: './supplier-detail.scss',
})
export class SupplierDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly suppliersService = inject(SuppliersService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly titleService = inject(Title);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly supplierData = rxResource<SupplierResponse, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }

      return this.suppliersService.getById(params);
    },
  });

  private readonly contactsData = rxResource<SupplierContactResponse[], string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }

      return this.suppliersService.listContacts(params);
    },
    defaultValue: [],
  });

  readonly bookingsPage = signal(0);
  readonly contractsPage = signal(0);
  private readonly PAGE_SIZE = 10;

  private readonly bookingsData = rxResource({
    params: () => ({ id: this.routeId() ?? null, page: this.bookingsPage() }),
    stream: ({ params }) => {
      if (!params.id) {
        return EMPTY;
      }

      return this.suppliersService.getBookings(params.id, {
        page: params.page + 1,
        limit: this.PAGE_SIZE,
      });
    },
  });

  private readonly contractsData = rxResource({
    params: () => ({ id: this.routeId() ?? null, page: this.contractsPage() }),
    stream: ({ params }) => {
      if (!params.id) {
        return EMPTY;
      }

      return this.suppliersService.getContracts(params.id, {
        page: params.page + 1,
        limit: this.PAGE_SIZE,
      });
    },
  });

  readonly supplier = computed(() => this.supplierData.value() ?? null);
  readonly loading = computed(() => this.supplierData.isLoading());
  readonly contacts = computed(() => {
    const items = this.contactsData.value() ?? [];

    return [...items].sort((a, b) => {
      if (a.primary && !b.primary) {
        return -1;
      }

      if (!a.primary && b.primary) {
        return 1;
      }

      return 0;
    });
  });
  readonly contactsLoading = computed(() => this.contactsData.isLoading());
  readonly bookings = computed(() => {
    const val = this.bookingsData.value();

    return (val as { items?: unknown[] } | null)?.items ?? [];
  });
  readonly bookingsTotal = computed(() => {
    const val = this.bookingsData.value();

    return (val as { total?: number } | null)?.total ?? 0;
  });
  readonly contracts = computed(() => this.contractsData.value()?.items ?? []);
  readonly contractsTotal = computed(() => this.contractsData.value()?.total ?? 0);

  readonly categoryLabels = SUPPLIER_CATEGORY_LABELS;
  readonly serviceTypeLabels = SUPPLIER_SERVICE_TYPE_LABELS;
  readonly pageSize = this.PAGE_SIZE;

  readonly deactivating = signal(false);

  private readonly _titleEffect = effect(() => {
    const s = this.supplier();

    if (s?.name) {
      this.titleService.setTitle(`${s.name} — Navio`);
    }
  });

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        void this.router.navigate(['/app/suppliers']);
      }
    });
  }

  getCategoryClasses(category: string): string {
    return CATEGORY_CHIP_CLASSES[category] ?? 'bg-gray-100 text-gray-600';
  }

  getPrimaryContact(s: SupplierResponse): string {
    if (s.phone) {
      return s.phone;
    }

    if (s.email) {
      return s.email;
    }

    return '—';
  }

  onBookingsPageChange(event: PageEvent): void {
    this.bookingsPage.set(event.pageIndex);
  }

  onContractsPageChange(event: PageEvent): void {
    this.contractsPage.set(event.pageIndex);
  }

  deactivate(): void {
    const id = this.routeId();

    if (!id || this.deactivating()) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Деактивировать поставщика',
        message: 'Поставщик будет скрыт из списка активных. Продолжить?',
        confirmLabel: 'Деактивировать',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.deactivating.set(true);
        this.suppliersService.deactivate(id).subscribe({
          next: () => {
            this.supplierData.reload();
            this.deactivating.set(false);
          },
          error: (err: { error?: { message?: string } }) => {
            this.snackBar.open(
              err?.error?.message ?? 'Не удалось деактивировать поставщика',
              'Close',
              { duration: 5000 },
            );
            this.deactivating.set(false);
          },
        });
      });
  }

  reactivate(): void {
    const id = this.routeId();

    if (!id || this.deactivating()) {
      return;
    }

    this.deactivating.set(true);
    this.suppliersService.reactivate(id).subscribe({
      next: () => {
        this.supplierData.reload();
        this.deactivating.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.snackBar.open(err?.error?.message ?? 'Не удалось активировать поставщика', 'Close', {
          duration: 5000,
        });
        this.deactivating.set(false);
      },
    });
  }

  openAddContactDialog(): void {
    const id = this.routeId();

    if (!id) {
      return;
    }

    const dialogRef = this.dialog.open<
      SupplierContactFormDialogComponent,
      SupplierContactFormDialogData,
      SupplierContactFormDialogResult
    >(SupplierContactFormDialogComponent, {
      width: '560px',
      data: { supplierId: id, mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.contactsData.reload();
      }
    });
  }

  openEditContactDialog(contact: SupplierContactResponse): void {
    const id = this.routeId();

    if (!id) {
      return;
    }

    const dialogRef = this.dialog.open<
      SupplierContactFormDialogComponent,
      SupplierContactFormDialogData,
      SupplierContactFormDialogResult
    >(SupplierContactFormDialogComponent, {
      width: '560px',
      data: { supplierId: id, mode: 'edit', contact },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.contactsData.reload();
      }
    });
  }

  makePrimary(contact: SupplierContactResponse): void {
    const id = this.routeId();

    if (!id) {
      return;
    }

    this.suppliersService.updateContact(id, contact.id, { isPrimary: true }).subscribe({
      next: () => this.contactsData.reload(),
      error: (err: { error?: { message?: string } }) =>
        this.snackBar.open(err?.error?.message ?? 'Не удалось изменить основной контакт', 'Close', {
          duration: 5000,
        }),
    });
  }

  deleteContact(contact: SupplierContactResponse): void {
    const id = this.routeId();

    if (!id) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Удалить контакт',
        message: `Удалить контакт ${contact.fullName ?? 'без имени'}?`,
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.suppliersService.deleteContact(id, contact.id).subscribe({
          next: () => this.contactsData.reload(),
          error: (err: { error?: { message?: string } }) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось удалить контакт', 'Close', {
              duration: 5000,
            }),
        });
      });
  }

  readonly contactsColumns = [
    'name',
    'role',
    'phone',
    'email',
    'telegram',
    'primary',
    'actions',
  ] as const;
  readonly bookingsColumns = ['number', 'client', 'departDate', 'status'] as const;
  readonly contractsColumns = ['number', 'status', 'signedAt', 'expiresAt'] as const;
}
