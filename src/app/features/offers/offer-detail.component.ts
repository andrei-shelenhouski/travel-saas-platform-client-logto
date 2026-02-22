import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BookingsService } from '../../services/bookings.service';
import { OffersService } from '../../services/offers.service';
import { ToastService } from '../../shared/services/toast.service';
import type { OfferResponseDto } from '../../shared/models';
import { OfferStatus } from '../../shared/models';
import {
  type OfferAction,
  getAllowedTransitions,
} from './offer-state-machine';
import { OfferTimelineComponent } from './offer-timeline.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog.component';

const STATUS_BADGE_CLASS: Record<OfferStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

const ACTION_LABELS: Record<OfferAction, string> = {
  EDIT: 'Edit',
  SEND: 'Send',
  ACCEPT: 'Accept',
  REJECT: 'Reject',
  EXPIRE: 'Expire',
  DUPLICATE: 'Duplicate',
  CREATE_BOOKING: 'Create booking',
  DELETE: 'Delete',
};

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [
    RouterLink,
    OfferTimelineComponent,
    ConfirmationDialogComponent,
  ],
  templateUrl: './offer-detail.component.html',
  styleUrl: './offer-detail.component.css',
})
export class OfferDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offersService = inject(OffersService);
  private readonly bookingsService = inject(BookingsService);
  private readonly toast = inject(ToastService);

  readonly offer = signal<OfferResponseDto | null>(null);
  readonly loading = signal(true);
  readonly actionLoading = signal(false);
  readonly confirmOpen = signal(false);
  readonly confirmPayload = signal<{
    action: 'REJECT' | 'EXPIRE' | 'DELETE';
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
  } | null>(null);

  protected readonly allowedActions = computed(() => {
    const o = this.offer();
    return o ? getAllowedTransitions(o.status as OfferStatus) : [];
  });

  protected readonly statusBadgeClass = computed(() => {
    const o = this.offer();
    return o ? STATUS_BADGE_CLASS[o.status as OfferStatus] : '';
  });

  protected readonly ACTION_LABELS = ACTION_LABELS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.showError('Offer ID missing');
      this.router.navigate(['/app/offers']);
      return;
    }
    this.loadOffer(id);
  }

  private loadOffer(id: string): void {
    this.loading.set(true);
    this.offersService.getById(id).subscribe({
      next: (data) => this.offer.set(data),
      error: (err) => {
        this.toast.showError(
          err.error?.message ?? err.message ?? 'Failed to load offer'
        );
        this.router.navigate(['/app/offers']);
      },
      complete: () => this.loading.set(false),
    });
  }

  private runTransition(
    id: string,
    action: OfferAction,
    newStatus?: OfferStatus
  ): void {
    this.actionLoading.set(true);
    const req =
      newStatus != null
        ? this.offersService.setStatus(id, newStatus)
        : null;

    if (action === 'DELETE') {
      this.offersService.delete(id).subscribe({
        next: () => {
          this.toast.showSuccess('Offer deleted');
          this.router.navigate(['/app/offers']);
        },
        error: (err) => {
          this.toast.showError(
            err.error?.message ?? err.message ?? 'Failed to delete offer'
          );
        },
        complete: () => this.actionLoading.set(false),
      });
      return;
    }

    if (action === 'DUPLICATE') {
      this.offersService.duplicate(id).subscribe({
        next: (created) => {
          this.toast.showSuccess('Offer duplicated');
          this.router.navigate(['/app/offers', created.id]);
        },
        error: (err) => {
          this.toast.showError(
            err.error?.message ?? err.message ?? 'Failed to duplicate offer'
          );
        },
        complete: () => this.actionLoading.set(false),
      });
      return;
    }

    if (action === 'CREATE_BOOKING') {
      this.bookingsService.create({ offerId: id }).subscribe({
        next: () => {
          this.toast.showSuccess('Booking created');
          this.loadOffer(id);
        },
        error: (err) => {
          this.toast.showError(
            err.error?.message ?? err.message ?? 'Failed to create booking'
          );
        },
        complete: () => this.actionLoading.set(false),
      });
      return;
    }

    if (req) {
      req.subscribe({
        next: (updated) => this.offer.set(updated),
        error: (err) => {
          this.toast.showError(
            err.error?.message ?? err.message ?? 'Action failed'
          );
        },
        complete: () => this.actionLoading.set(false),
      });
    } else {
      this.actionLoading.set(false);
    }
  }

  protected onActionClick(action: OfferAction): void {
    const o = this.offer();
    if (!o || this.actionLoading()) return;

    if (action === 'REJECT' || action === 'EXPIRE' || action === 'DELETE') {
      const payloads = {
        REJECT: {
          action: 'REJECT' as const,
          title: 'Reject offer',
          message: 'Are you sure you want to reject this offer?',
          confirmLabel: 'Reject',
          danger: true,
        },
        EXPIRE: {
          action: 'EXPIRE' as const,
          title: 'Expire offer',
          message: 'Are you sure you want to mark this offer as expired?',
          confirmLabel: 'Expire',
          danger: true,
        },
        DELETE: {
          action: 'DELETE' as const,
          title: 'Delete offer',
          message: 'Are you sure you want to delete this draft offer?',
          confirmLabel: 'Delete',
          danger: true,
        },
      };
      this.confirmPayload.set(payloads[action]);
      this.confirmOpen.set(true);
      return;
    }

    if (action === 'EDIT') {
      this.router.navigate(['/app/offers', o.id, 'edit']);
      return;
    }

    const statusMap: Partial<Record<OfferAction, OfferStatus>> = {
      SEND: OfferStatus.SENT,
      ACCEPT: OfferStatus.ACCEPTED,
      REJECT: OfferStatus.REJECTED,
      EXPIRE: OfferStatus.EXPIRED,
    };
    const newStatus = statusMap[action];
    if (newStatus) this.runTransition(o.id, action, newStatus);
    else if (action === 'DUPLICATE') this.runTransition(o.id, action);
    else if (action === 'CREATE_BOOKING') this.runTransition(o.id, action);
  }

  protected onConfirmDialogConfirm(): void {
    const payload = this.confirmPayload();
    const o = this.offer();
    if (!payload || !o) {
      this.confirmOpen.set(false);
      this.confirmPayload.set(null);
      return;
    }
    this.confirmOpen.set(false);
    this.confirmPayload.set(null);
    if (payload.action === 'REJECT') {
      this.runTransition(o.id, 'REJECT', OfferStatus.REJECTED);
    } else if (payload.action === 'EXPIRE') {
      this.runTransition(o.id, 'EXPIRE', OfferStatus.EXPIRED);
    } else if (payload.action === 'DELETE') {
      this.runTransition(o.id, 'DELETE');
    }
  }

  protected onConfirmDialogCancel(): void {
    this.confirmOpen.set(false);
    this.confirmPayload.set(null);
  }

  protected getConfirmConfig() {
    const p = this.confirmPayload();
    return {
      open: this.confirmOpen(),
      title: p?.title ?? 'Confirm',
      message: p?.message ?? '',
      confirmLabel: p?.confirmLabel ?? 'Confirm',
      danger: p?.danger ?? false,
    };
  }
}
