import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { BookingsService } from '../../../services/bookings.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog.component';
import type { BookingResponseDto } from '../../../shared/models';
import { BookingStatus } from '../../../shared/models';

const STATUS_BADGE_CLASS: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

@Component({
  selector: 'app-booking-detail',
  imports: [RouterLink, ConfirmationDialogComponent],
  templateUrl: './booking-detail.html',
  styleUrl: './booking-detail.css',
})
export class BookingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingsService = inject(BookingsService);
  private readonly toast = inject(ToastService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<BookingResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;
      if (id == null) return EMPTY;
      return this.bookingsService.getById(id);
    },
  });

  readonly BookingStatus = BookingStatus;
  readonly booking = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly statusBadgeClass = STATUS_BADGE_CLASS;
  readonly actionLoading = signal(false);
  readonly confirmOpen = signal(false);
  readonly confirmPayload = signal<{
    action: 'CANCEL_BOOKING' | 'DELETE';
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
  } | null>(null);

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/bookings']);
      }
    });
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  getStatusBadgeClass(status: string): string {
    return STATUS_BADGE_CLASS[status] ?? 'bg-gray-100 text-gray-500';
  }

  markCancelled(): void {
    const b = this.booking();
    if (!b || this.actionLoading()) return;
    this.confirmPayload.set({
      action: 'CANCEL_BOOKING',
      title: 'Cancel booking',
      message: 'Are you sure you want to mark this booking as cancelled?',
      confirmLabel: 'Cancel booking',
      danger: true,
    });
    this.confirmOpen.set(true);
  }

  markConfirmed(): void {
    const b = this.booking();
    if (!b || this.actionLoading()) return;
    this.actionLoading.set(true);
    this.bookingsService.update(b.id, { status: BookingStatus.CONFIRMED }).subscribe({
      next: (updated) => this.data.set(updated),
      error: (err) => this.toast.showError(err.error?.message ?? err.message ?? 'Failed to update'),
      complete: () => this.actionLoading.set(false),
    });
  }

  deleteBooking(): void {
    const b = this.booking();
    if (!b || this.actionLoading()) return;
    this.confirmPayload.set({
      action: 'DELETE',
      title: 'Delete booking',
      message: 'Are you sure you want to delete this booking? This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    this.confirmOpen.set(true);
  }

  onConfirmDialogConfirm(): void {
    const payload = this.confirmPayload();
    const b = this.booking();
    if (!payload || !b) {
      this.confirmOpen.set(false);
      return;
    }
    this.actionLoading.set(true);
    if (payload.action === 'CANCEL_BOOKING') {
      this.bookingsService.update(b.id, { status: BookingStatus.CANCELLED }).subscribe({
        next: (updated) => this.data.set(updated),
        error: (err) => this.toast.showError(err.error?.message ?? err.message ?? 'Failed to update'),
        complete: () => {
          this.actionLoading.set(false);
          this.confirmOpen.set(false);
          this.confirmPayload.set(null);
        },
      });
    } else if (payload.action === 'DELETE') {
      this.bookingsService.delete(b.id).subscribe({
        next: () => {
          this.toast.showSuccess('Booking deleted');
          this.router.navigate(['/app/bookings']);
        },
        error: (err) => this.toast.showError(err.error?.message ?? err.message ?? 'Failed to delete'),
        complete: () => {
          this.actionLoading.set(false);
          this.confirmOpen.set(false);
          this.confirmPayload.set(null);
        },
      });
    }
  }

  onConfirmDialogCancel(): void {
    this.confirmOpen.set(false);
    this.confirmPayload.set(null);
  }
}
