import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { BookingsService } from '@app/services/bookings.service';
import { InvoicesService } from '@app/services/invoices.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';
import type { CreateInvoiceDto } from '@app/shared/models';
import { BookingStatus } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-invoice',
  imports: [RouterLink, ReactiveFormsModule, ...MAT_FORM_BUTTONS],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.scss',
})
export class CreateInvoiceComponent {
  private readonly router = inject(Router);
  private readonly bookingsService = inject(BookingsService);
  private readonly invoicesService = inject(InvoicesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    bookingId: ['', Validators.required],
    issueDate: [new Date().toISOString().slice(0, 10), Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['USD', Validators.required],
    dueDate: [''],
  });

  private readonly bookingsResource = rxResource({
    stream: () =>
      this.bookingsService.getList({
        status: BookingStatus.CONFIRMED,
        page: 1,
        limit: 100,
      }),
  });

  readonly bookings = computed(() => this.bookingsResource.value()?.items ?? []);
  readonly bookingsLoading = computed(() => this.bookingsResource.isLoading());

  onSubmit(): void {
    this.error.set('');
    const v = this.form.getRawValue();
    const bid = v.bookingId.trim();

    if (!bid) {
      this.error.set('Please select a booking.');

      return;
    }
    this.saving.set(true);
    const dto: CreateInvoiceDto = {
      bookingId: bid,
      issueDate: v.issueDate,
      amount: v.amount,
      currency: v.currency.trim(),
    };

    if (v.dueDate.trim()) {
      dto.dueDate = v.dueDate.trim();
    }

    this.invoicesService.create(dto).subscribe({
      next: (created) => {
        this.toast.showSuccess('Invoice created');
        this.router.navigate(['/app/invoices', created.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to create invoice');
      },
      complete: () => this.saving.set(false),
    });
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }
}
