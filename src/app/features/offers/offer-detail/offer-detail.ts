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
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPTY, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { calculateNights } from '@app/features/offers/offer-builder.utils';
import { OfferPdfPreviewModalComponent } from '@app/features/offers/offer-pdf-preview-modal/offer-pdf-preview-modal';
import { getAllowedTransitions, OfferAction } from '@app/features/offers/offer-state-machine';
import { OfferTimelineComponent } from '@app/features/offers/offer-timeline/offer-timeline';
import { BookingsService } from '@app/services/bookings.service';
import { OffersService } from '@app/services/offers.service';
import { PermissionService } from '@app/services/permission.service';
import { RequestsService } from '@app/services/requests.service';
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog.component';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS, MAT_DIALOG } from '@app/shared/material-imports';
import { OfferStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type {
  OfferResponseDto,
  PaginatedBookingResponseDto,
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
    PageHeading,
    ...MAT_BUTTONS,
    ...MAT_DIALOG,
  ],
  templateUrl: './offer-detail.html',
  styleUrl: './offer-detail.scss',
})
export class OfferDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingsService = inject(BookingsService);
  private readonly offersService = inject(OffersService);
  private readonly requestsService = inject(RequestsService);
  private readonly dialog = inject(MatDialog);
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
  protected readonly bookingIdFromOffer = computed(() => {
    const current = this.offer();

    if (!current || !('bookingId' in current)) {
      return undefined;
    }

    const bookingId = current['bookingId' as keyof typeof current];

    return typeof bookingId === 'string' ? bookingId : undefined;
  });

  protected readonly bookingLookup = rxResource<PaginatedBookingResponseDto, string | null>({
    params: (): string | null => {
      const currentOffer = this.offer();

      if (
        !currentOffer ||
        currentOffer.status !== OfferStatus.ACCEPTED ||
        this.bookingIdFromOffer()
      ) {
        return null;
      }

      return currentOffer.id;
    },
    stream: ({ params }) => {
      const offerId = params;

      if (!offerId) {
        return of({ items: [], total: 0, page: 1, limit: 1 });
      }

      return this.bookingsService.getList({ offerId, page: 1, limit: 1 });
    },
  });

  protected readonly resolvedBookingId = computed(() => {
    const directBookingId = this.bookingIdFromOffer();

    if (directBookingId) {
      return directBookingId;
    }

    return this.bookingLookup.value()?.items[0]?.id;
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

    if (this.resolvedBookingId() && actions.includes('DELETE')) {
      return actions.filter((a) => a !== 'DELETE');
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
      const linkedBookingId = this.resolvedBookingId();

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

  protected openPdfPreview(): void {
    const currentOffer = this.offer();

    if (!currentOffer) {
      return;
    }

    this.dialog.open(OfferPdfPreviewModalComponent, {
      data: {
        offerId: currentOffer.id,
        offerNumber: currentOffer.number ?? currentOffer.id,
      },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'pdf-preview-dialog',
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

    this.offersService
      .setStatus(id, newStatus)
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: (updated) => {
          this.data.set(updated);

          if (newStatus === OfferStatus.SENT) {
            this.toast.showSuccess('Offer sent');
          }

          if (newStatus === OfferStatus.ACCEPTED) {
            const linkedBookingId =
              'bookingId' in updated &&
              typeof (updated as Record<string, unknown>)['bookingId'] === 'string'
                ? ((updated as Record<string, unknown>)['bookingId'] as string)
                : undefined;

            if (linkedBookingId) {
              this.toast.showSuccess('Offer accepted');
              this.router.navigate(['/app/bookings', linkedBookingId]);
            } else {
              this.toast.showSuccess('Offer accepted. Booking will appear shortly.');
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
      });
  }

  private runDeleteAction(id: string): void {
    this.actionLoading.set(true);

    this.offersService
      .delete(id)
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Offer deleted');
          this.router.navigate(['/app/offers']);
        },
        error: (err) => {
          this.toast.showError(err.error?.message ?? err.message ?? 'Failed to delete offer');
        },
      });
  }

  private runReviseAction(id: string): void {
    this.actionLoading.set(true);

    this.offersService
      .revise(id)
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: (revisedOffer) => {
          this.toast.showSuccess('Revision created');
          this.router.navigate(['/app/offers', revisedOffer.id, 'edit']);
        },
        error: (err) => {
          this.toast.showError(err.error?.message ?? err.message ?? 'Failed to revise offer');
        },
      });
  }
}
