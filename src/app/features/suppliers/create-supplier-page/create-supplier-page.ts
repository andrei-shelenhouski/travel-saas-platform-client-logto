import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { SuppliersService } from '@app/services/suppliers.service';
import { SupplierFormComponent } from '../supplier-form/supplier-form';

import type { CreateSupplierRequest } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-supplier-page',
  imports: [SupplierFormComponent],
  template: `
    <app-supplier-form
      mode="create"
      [saving]="saving()"
      [submitError]="submitError()"
      (cancelled)="cancel()"
      (createSubmitted)="onCreateSubmitted($event)"
    />
  `,
})
export class CreateSupplierPageComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly suppliersService = inject(SuppliersService);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);
  readonly submitError = signal('');

  cancel(): void {
    void this.router.navigate(['..'], { relativeTo: this.activatedRoute });
  }

  onCreateSubmitted(dto: CreateSupplierRequest): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.submitError.set('');

    this.suppliersService.create(dto).subscribe({
      next: (created) => {
        this.snackBar.open('Поставщик создан', 'Закрыть', { duration: 3000 });
        void this.router.navigate(['/app/suppliers', created.id]);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.submitError.set(err.error?.message ?? err.message ?? 'Не удалось создать поставщика');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }
}
