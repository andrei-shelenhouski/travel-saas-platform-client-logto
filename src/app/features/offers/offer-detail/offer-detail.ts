import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';

import { calculateNights } from '@app/features/offers/offer-builder.utils';
import { getAllowedTransitions, OfferAction } from '@app/features/offers/offer-state-machine';
import { OfferTimelineComponent } from '@app/features/offers/offer-timeline/offer-timeline';
import { OffersService } from '@app/services/offers.service';
import { PermissionService } from '@app/services/permission.service';
import { RequestsService } from '@app/services/requests.service';
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog.component';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { OfferStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type {
  OfferResponseDto,
  RequestResponseDto,
  UpdateOfferStatusDto,
} from '@app/shared/models';

type LoadError = {
  status?: number;
  error?: { message?: string };
  message?: string;
};

const STATUS_BADGE_CLASS: Record<OfferStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-sky-100 text-sky-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

const ACTION_LABELS: Record<OfferAction, string> = {
  EDIT: 'Edit',
  SEND: 'Send',
  ACCEPT: 'Accept',
  REJECT: 'Reject',
  REVISE: 'Revise',
  VIEW_BOOKING: 'Open booking',
  DELETE: 'Delete',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offer-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    OfferTimelineComponent,
    ConfirmationDialogComponent,
    ...MAT_BUTTONS,
  ],
  templateUrl: './offer-detail.html',
  styleUrl: './offer-detail.scss',
})
export class OfferDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offersService = inject(OffersService);
  private readonly requestsService = inject(RequestsService);
  private readonly toast = inject(ToastService);
  private readonly permissions = inject(PermissionService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<OfferResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.offersService.getById(id);
    },
  });

  protected readonly offer = computed(() => this.data.value() ?? null);
  protected readonly loading = computed(() => this.data.isLoading());
  protected readonly hasError = computed(
    () => this.data.error() !== undefined && this.data.error() !== null,
  );

  protected readonly request = rxResource<RequestResponseDto, string | null>({
    params: (): string | null => this.offer()?.requestId ?? null,
    stream: ({ params }) => {
      const requestId = params;

      if (requestId === null) {
        return EMPTY;
      }

      return this.requestsService.getById(requestId);
    },
  });

  protected readonly loadErrorMessage = computed(() => {
    const error = this.data.error() as LoadError | undefined;

    if (!error) {
      return '';
    }

    if (error.status === 404) {
      return 'Offer not found';
    }

    if (error.status === 403) {
      return 'You do not have access to this offer';
    }

    return error.error?.message ?? error.message ?? 'Failed to load offer';
  });

  protected readonly actionLoading = signal(false);
  protected readonly pdfLoading = signal(false);
  protected readonly confirmOpen = signal(false);
  protected readonly confirmPayload = signal<{
    action: 'SEND' | 'ACCEPT' | 'REJECT' | 'DELETE';
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
  } | null>(null);

  protected readonly displayOfferNumber = computed(
    () => this.offer()?.number ?? this.offer()?.id ?? '',
  );
  protected readonly displayVersion = computed(() => `v${this.offer()?.version ?? 1}`);
  protected readonly canSeeInternalNotes = computed(() => !this.permissions.isAgent());
  protected readonly hasVersionHistory = computed(() => !!this.offer()?.previousVersionId);
  protected readonly bookingId = computed(() => {
    const current = this.offer() as OfferResponseDto & { bookingId?: string };

    return current.bookingId;
  });

  protected readonly allowedActions = computed(() => {
    const currentOffer = this.offer();

    if (!currentOffer) {
      return [];
    }

    const actions = getAllowedTransitions(currentOffer.status as OfferStatus);

    if (!this.permissions.canDeleteOffer() && actions.includes('DELETE')) {
      return actions.filter((a) => a !== 'DELETE');
    }

    if (this.bookingId() && actions.includes('DELETE')) {
      return actions.filter((a) => a !== 'DELETE');
    }

    if (actions.includes('VIEW_BOOKING') && !this.bookingId()) {
      return actions.filter((a) => a !== 'VIEW_BOOKING');
    }

    return actions;
  });

  protected readonly statusBadgeClass = computed(() => {
    const currentOffer = this.offer();

    return currentOffer ? STATUS_BADGE_CLASS[currentOffer.status as OfferStatus] : '';
  });

  protected readonly ACTION_LABELS = ACTION_LABELS;

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.toast.showError('Offer ID is missing');
        this.router.navigate(['/app/offers']);
      }
    });
  }

  protected onBackClick(): void {
    this.router.navigate(['/app/offers']);
  }

  protected onActionClick(action: OfferAction): void {
    const currentOffer = this.offer();

    if (!currentOffer || this.actionLoading()) {
      return;
    }

    if (action === 'EDIT') {
      this.router.navigate(['/app/offers', currentOffer.id, 'edit']);

      return;
    }

    if (action === 'VIEW_BOOKING') {
      const linkedBookingId = this.bookingId();

      if (!linkedBookingId) {
        this.toast.showError('Booking is not available for this offer');

        return;
      }

      this.router.navigate(['/app/bookings', linkedBookingId]);

      return;
    }

    if (action === 'REVISE') {
      this.runReviseAction(currentOffer.id);

      return;
    }

    const payloads = {
      SEND: {
        action: 'SEND' as const,
        title: 'Send offer',
        message: 'Send this offer to the client?',
        confirmLabel: 'Send',
        danger: false,
      },
      ACCEPT: {
        action: 'ACCEPT' as const,
        title: 'Accept offer',
        message: 'Mark this offer as accepted? This action cannot be undone.',
        confirmLabel: 'Accept',
        danger: true,
      },
      REJECT: {
        action: 'REJECT' as const,
        title: 'Reject offer',
        message: 'Mark this offer as rejected by the client?',
        confirmLabel: 'Reject',
        danger: true,
      },
      DELETE: {
        action: 'DELETE' as const,
        title: 'Delete offer',
        message: 'Delete this draft offer?',
        confirmLabel: 'Delete',
        danger: true,
      },
    };

    if (action === 'SEND' || action === 'ACCEPT' || action === 'REJECT' || action === 'DELETE') {
      this.confirmPayload.set(payloads[action]);
      this.confirmOpen.set(true);
    }
  }

  protected onConfirmDialogConfirm(): void {
    const payload = this.confirmPayload();
    const currentOffer = this.offer();

    if (!payload || !currentOffer) {
      this.confirmOpen.set(false);
      this.confirmPayload.set(null);

      return;
    }

    this.confirmOpen.set(false);
    this.confirmPayload.set(null);

    if (payload.action === 'SEND') {
      this.runStatusAction(currentOffer.id, OfferStatus.SENT);

      return;
    }

    if (payload.action === 'ACCEPT') {
      this.runStatusAction(currentOffer.id, OfferStatus.ACCEPTED);

      return;
    }

    if (payload.action === 'REJECT') {
      this.runStatusAction(currentOffer.id, OfferStatus.REJECTED);

      return;
    }

    if (payload.action === 'DELETE') {
      this.runDeleteAction(currentOffer.id);
    }
  }

  protected onConfirmDialogCancel(): void {
    this.confirmOpen.set(false);
    this.confirmPayload.set(null);
  }

  protected downloadPdf(): void {
    const offerId = this.offer()?.id;

    if (!offerId || this.pdfLoading()) {
      return;
    }

    this.pdfLoading.set(true);

    this.offersService.getPdf(offerId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const popup = window.open(url, '_blank', 'noopener,noreferrer');

        if (!popup) {
          this.toast.showError('Unable to open PDF preview');
        }

        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      },
      error: (err) => {
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to download PDF');
      },
      complete: () => this.pdfLoading.set(false),
    });
  }

  protected isDestructiveAction(action: OfferAction): boolean {
    return action === 'ACCEPT' || action === 'REJECT' || action === 'DELETE';
  }

  protected getAccommodationNights(checkinDate?: string, checkoutDate?: string): number | string {
    if (!checkinDate || !checkoutDate) {
      return '-';
    }

    return calculateNights(checkinDate, checkoutDate);
  }

  private runStatusAction(id: string, newStatus: UpdateOfferStatusDto['status']): void {
    const currentOffer = this.offer();

    if (!currentOffer) {
      return;
    }

    this.data.set({ ...currentOffer, status: newStatus } as OfferResponseDto);
    this.actionLoading.set(true);

    this.offersService.setStatus(id, newStatus).subscribe({
      next: (updated) => {
        this.data.set(updated);

        if (newStatus === OfferStatus.SENT) {
          this.toast.showSuccess('Offer sent');
        }

        if (newStatus === OfferStatus.ACCEPTED) {
          const linkedBookingId = (updated as OfferResponseDto & { bookingId?: string }).bookingId;

          this.toast.showSuccess('Offer accepted');

          if (linkedBookingId) {
            this.router.navigate(['/app/bookings', linkedBookingId]);
          }
        }

        if (newStatus === OfferStatus.REJECTED) {
          this.toast.showSuccess('Offer marked as rejected');
        }
      },
      error: (err) => {
        this.data.set(currentOffer);
        this.toast.showError(err.error?.message ?? err.message ?? 'Action failed');
      },
      complete: () => this.actionLoading.set(false),
    });
  }

  private runDeleteAction(id: string): void {
    this.actionLoading.set(true);

    this.offersService.delete(id).subscribe({
      next: () => {
        this.toast.showSuccess('Offer deleted');
        this.router.navigate(['/app/offers']);
      },
      error: (err) => {
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to delete offer');
      },
      complete: () => this.actionLoading.set(false),
    });
  }

  private runReviseAction(id: string): void {
    this.actionLoading.set(true);

    this.offersService.revise(id).subscribe({
      next: (revisedOffer) => {
        this.toast.showSuccess('Revision created');
        this.router.navigate(['/app/offers', revisedOffer.id, 'edit']);
      },
      error: (err) => {
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to revise offer');
      },
      complete: () => this.actionLoading.set(false),
    });
  }
}
