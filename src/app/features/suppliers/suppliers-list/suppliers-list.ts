import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { toSignal } from '@angular/core/rxjs-interop';

import { SuppliersService } from '@app/services/suppliers.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import {
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_SERVICE_TYPE_LABELS,
  SupplierCategory,
} from '@app/shared/models';

import type { SupplierResponse } from '@app/shared/models';

const PAGE_SIZE = 20;

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
  selector: 'app-suppliers-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
    PageHeading,
    PageHeadingAction,
  ],
  templateUrl: './suppliers-list.html',
  styleUrl: './suppliers-list.scss',
  host: { class: 'flex flex-col h-full' },
})
export class SuppliersListComponent {
  private readonly suppliersService = inject(SuppliersService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly currentPage = signal(0);

  protected readonly categoryOptions = Object.entries(SUPPLIER_CATEGORY_LABELS).map(
    ([value, label]) => ({ value, label }),
  );
  protected readonly serviceTypeOptions = Object.entries(SUPPLIER_SERVICE_TYPE_LABELS).map(
    ([value, label]) => ({ value, label }),
  );

  protected readonly filterForm = this.fb.nonNullable.group({
    search: this.fb.nonNullable.control(''),
    category: this.fb.nonNullable.control<string | ''>(''),
    serviceType: this.fb.nonNullable.control<string | ''>(''),
    isActive: this.fb.nonNullable.control<boolean | null>(null),
  });

  private readonly formValue = toSignal(
    this.filterForm.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: this.filterForm.value },
  );

  private readonly _resetPage = effect(() => {
    this.formValue();
    this.currentPage.set(0);
  });

  private readonly data = rxResource({
    params: () => ({
      filter: this.formValue(),
      page: this.currentPage(),
    }),
    stream: ({ params }) => {
      const { filter, page } = params;
      const search = filter.search ?? '';

      return this.suppliersService.getList({
        page: page + 1,
        limit: PAGE_SIZE,
        search: search.length >= 2 ? search : undefined,
        category: filter.category || undefined,
        serviceType: filter.serviceType || undefined,
        isActive:
          filter.isActive !== null && filter.isActive !== undefined ? filter.isActive : undefined,
      });
    },
  });

  protected readonly suppliers = computed(() => this.data.value()?.items ?? []);
  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());
  protected readonly error = computed(() => {
    const err = this.data.error();

    if (!err) {
      return undefined;
    }

    return (
      (err as { error?: { message?: string }; message?: string })?.error?.message ??
      (err as { message?: string })?.message ??
      'Не удалось загрузить поставщиков'
    );
  });

  protected readonly displayedColumns = [
    'name',
    'category',
    'serviceTypes',
    'destination',
    'contact',
    'active',
    'actions',
  ] as const;

  protected readonly categoryLabels = SUPPLIER_CATEGORY_LABELS;
  protected readonly serviceTypeLabels = SUPPLIER_SERVICE_TYPE_LABELS;

  getCategoryClasses(category: string): string {
    return CATEGORY_CHIP_CLASSES[category] ?? 'bg-gray-100 text-gray-600';
  }

  getPrimaryContact(supplier: SupplierResponse): string {
    if (supplier.phone) {
      return supplier.phone;
    }

    if (supplier.email) {
      return supplier.email;
    }

    return '—';
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  clearSearch(): void {
    this.filterForm.patchValue({ search: '' });
  }

  navigateToDetail(supplier: SupplierResponse): void {
    void this.router.navigate(['/app/suppliers', supplier.id]);
  }

  navigateToCreate(): void {
    void this.router.navigate(['/app/suppliers/new']);
  }
}
