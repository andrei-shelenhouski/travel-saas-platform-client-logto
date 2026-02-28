import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';

import { BookingsService } from '../../../services/bookings.service';
import { InvoicesService } from '../../../services/invoices.service';
import { ToastService } from '../../../shared/services/toast.service';
import type { CreateInvoiceDto } from '../../../shared/models';
import { BookingStatus } from '../../../shared/models';

@Component({
  selector: 'app-create-invoice',
  imports: [RouterLink, FormsModule],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.css',
})
export class CreateInvoiceComponent {
  private readonly router = inject(Router);
  private readonly bookingsService = inject(BookingsService);
  private readonly invoicesService = inject(InvoicesService);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);
  readonly error = signal('');

  bookingId = '';
  dueDate = '';

  private readonly bookingsResource = rxResource({
    stream: () =>
      this.bookingsService.getList({
        status: BookingStatus.CONFIRMED,
        page: 1,
        limit: 100,
      }),
  });

  readonly bookings = computed(() => this.bookingsResource.value()?.data ?? []);
  readonly bookingsLoading = computed(() => this.bookingsResource.isLoading());

  onSubmit(): void {
    this.error.set('');
    const bid = this.bookingId.trim();
    if (!bid) {
      this.error.set('Please select a booking.');
      return;
    }
    this.saving.set(true);
    const dto: CreateInvoiceDto = { bookingId: bid };
    if (this.dueDate.trim()) dto.dueDate = this.dueDate.trim();

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
