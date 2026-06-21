import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { SuppliersService } from '@app/services/suppliers.service';
import { SupplierFormComponent } from '../supplier-form/supplier-form';

import type { SupplierResponse, UpdateSupplierRequest } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-edit-supplier-page',
  imports: [SupplierFormComponent],
  template: `
    <app-supplier-form
      mode="edit"
      [initialSupplier]="supplier()"
      [loading]="loading()"
      [saving]="saving()"
      [submitError]="submitError()"
      (cancelled)="cancel()"
      (updateSubmitted)="onUpdateSubmitted($event)"
    />
  `,
})
export class EditSupplierPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly suppliersService = inject(SuppliersService);
  private readonly snackBar = inject(MatSnackBar);

  readonly supplier = signal<SupplierResponse | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitError = signal('');

  private supplierId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      void this.router.navigate(['..'], { relativeTo: this.route });

      return;
    }

    this.supplierId = id;
    this.loadSupplier(id);
  }

  cancel(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }

  onUpdateSubmitted(dto: UpdateSupplierRequest): void {
    const id = this.supplierId;

    if (!id || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.submitError.set('');

    this.suppliersService.update(id, dto).subscribe({
      next: () => {
        this.snackBar.open('Поставщик обновлён', 'Закрыть', { duration: 3000 });
        void this.router.navigate(['/app/suppliers', id]);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.submitError.set(err.error?.message ?? err.message ?? 'Не удалось обновить поставщика');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private loadSupplier(id: string): void {
    this.loading.set(true);
    this.suppliersService.getById(id).subscribe({
      next: (s) => this.supplier.set(s),
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.snackBar.open(
          err.error?.message ?? err.message ?? 'Не удалось загрузить поставщика',
          'Закрыть',
          { duration: 5000 },
        );
        void this.router.navigate(['/app/suppliers']);
      },
      complete: () => this.loading.set(false),
    });
  }
}
