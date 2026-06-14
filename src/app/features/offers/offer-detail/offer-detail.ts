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
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { OfferPdfPreviewModalComponent } from '@app/features/offers/offer-pdf-preview-modal/offer-pdf-preview-modal';
import { getAllowedTransitions, OfferAction } from '@app/features/offers/offer-state-machine';
import { BookingsService } from '@app/services/bookings.service';
import { MeService } from '@app/services/me.service';
import { OffersService } from '@app/services/offers.service';
import { PermissionService } from '@app/services/permission.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import {
  DetailSectionComponent,
  HistoryPanelComponent,
  LoadingStateComponent,
  PageContentComponent,
} from '@app/shared/components';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { OfferStatus } from '@app/shared/models';
import { OfferAccommodationsTableComponent } from './offer-accommodations-table/offer-accommodations-table';
import { OfferServicesTableComponent } from './offer-services-table/offer-services-table';

import type {
  OfferResponseDto,
  PaginatedBookingResponseDto,
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
  EDIT: 'Редактировать',
  SEND: 'Отправить',
  ACCEPT: 'Принять',
  REJECT: 'Отклонить',
  REVISE: 'Исправить',
  VIEW_BOOKING: 'Открыть бронирование',
  DELETE: 'Удалить',
};

const ACTION_ICONS: Record<OfferAction, string> = {
  EDIT: 'edit',
  SEND: 'send',
  ACCEPT: 'check_circle',
  REJECT: 'cancel',
  REVISE: 'edit_note',
  VIEW_BOOKING: 'open_in_new',
  DELETE: 'delete',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offer-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    PageHeading,
    PageHeadingAction,
    LoadingStateComponent,
    PageContentComponent,
    DetailSectionComponent,
    HistoryPanelComponent,
    MatButtonModule,
    MatDialogModule,
    OfferAccommodationsTableComponent,
    OfferServicesTableComponent,
  ],
  templateUrl: './offer-detail.html',
  styleUrl: './offer-detail.scss',
})
export class OfferDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingsService = inject(BookingsService);
  private readonly offersService = inject(OffersService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly titleService = inject(Title);
  private readonly permissions = inject(PermissionService);
  private readonly meService = inject(MeService);

  protected readonly currentUserId = computed(() => this.meService.getMeData()?.id ?? null);

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

  protected readonly loadErrorMessage = computed(() => {
    const error = this.data.error() as LoadError | undefined;

    if (!error) {
      return '';
    }

    if (error.status === 404) {
      return 'Предложение не найдено';
    }

    if (error.status === 403) {
      return 'У вас нет доступа к этому предложению';
    }

    return error.error?.message ?? error.message ?? 'Не удалось загрузить предложение';
  });

  protected readonly actionLoading = signal(false);

  protected readonly displayOfferNumber = computed(
    () => this.offer()?.number ?? this.offer()?.id ?? '',
  );
  protected readonly pageTitle = computed(() => `Предложение ${this.displayOfferNumber()}`);
  protected readonly pageSubtitle = 'Детали предложения';

  private readonly _titleEffect = effect(() => {
    const title = this.pageTitle();

    if (this.offer()) {
      this.titleService.setTitle(`${title} — Navio`);
    }
  });
  protected readonly displayVersion = computed(() => `v${this.offer()?.version ?? 1}`);
  protected readonly canSeeInternalNotes = computed(() => this.permissions.canViewAllOffers());
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
  protected readonly ACTION_ICONS = ACTION_ICONS;

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.snackBar.open('Offer ID is missing', 'Close', { duration: 5000 });
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
        this.snackBar.open('Booking is not available for this offer', 'Close', { duration: 5000 });

        return;
      }

      this.router.navigate(['/app/bookings', linkedBookingId]);

      return;
    }

    if (action === 'REVISE') {
      this.runReviseAction(currentOffer.id);

      return;
    }

    const payloads: Record<
      'SEND' | 'ACCEPT' | 'REJECT' | 'DELETE',
      { title: string; message: string; confirmLabel: string; destructive: boolean }
    > = {
      SEND: {
        title: 'Отправить предложение',
        message: 'Отправить это предложение клиенту?',
        confirmLabel: 'Отправить',
        destructive: false,
      },
      ACCEPT: {
        title: 'Принять предложение',
        message: 'Пометить предложение как принятое? Это действие нельзя отменить.',
        confirmLabel: 'Принять',
        destructive: true,
      },
      REJECT: {
        title: 'Отклонить предложение',
        message: 'Пометить предложение как отклонённое клиентом?',
        confirmLabel: 'Отклонить',
        destructive: true,
      },
      DELETE: {
        title: 'Удалить предложение',
        message: 'Удалить этот черновик предложения?',
        confirmLabel: 'Удалить',
        destructive: true,
      },
    };

    if (action === 'SEND' || action === 'ACCEPT' || action === 'REJECT' || action === 'DELETE') {
      const payload = payloads[action];

      this.confirmDialog.open(payload).subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        if (action === 'SEND') {
          this.runStatusAction(currentOffer.id, OfferStatus.SENT);
        } else if (action === 'ACCEPT') {
          this.runStatusAction(currentOffer.id, OfferStatus.ACCEPTED);
        } else if (action === 'REJECT') {
          this.runStatusAction(currentOffer.id, OfferStatus.REJECTED);
        } else if (action === 'DELETE') {
          this.runDeleteAction(currentOffer.id);
        }
      });
    }
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
            this.snackBar.open('Предложение отправлено', 'Close', { duration: 4000 });
          }

          if (newStatus === OfferStatus.ACCEPTED) {
            const linkedBookingId =
              'bookingId' in updated &&
              typeof (updated as Record<string, unknown>)['bookingId'] === 'string'
                ? ((updated as Record<string, unknown>)['bookingId'] as string)
                : undefined;

            if (linkedBookingId) {
              this.snackBar.open('Предложение принято', 'Close', { duration: 4000 });
              this.router.navigate(['/app/bookings', linkedBookingId]);
            } else {
              this.snackBar.open(
                'Предложение принято. Бронирование появится в ближайшее время.',
                'Close',
                { duration: 4000 },
              );
            }
          }

          if (newStatus === OfferStatus.REJECTED) {
            this.snackBar.open('Предложение отклонено', 'Close', { duration: 4000 });
          }
        },
        error: (err) => {
          this.data.set(currentOffer);
          this.snackBar.open(
            err.error?.message ?? err.message ?? 'Не удалось выполнить действие',
            'Close',
            { duration: 5000 },
          );
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
          this.snackBar.open('Предложение удалено', 'Close', { duration: 4000 });
          this.router.navigate(['/app/offers']);
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message ?? err.message ?? 'Не удалось удалить предложение',
            'Close',
            { duration: 5000 },
          );
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
          this.snackBar.open('Исправление создано', 'Close', { duration: 4000 });
          this.router.navigate(['/app/offers', revisedOffer.id, 'edit']);
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message ?? err.message ?? 'Не удалось создать исправление',
            'Close',
            { duration: 5000 },
          );
        },
      });
  }
}
