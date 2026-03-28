import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { rxResource } from '@angular/core/rxjs-interop';

import { OffersService } from '@app/services/offers.service';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS } from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';
import { StatusBadgeComponent } from '@app/shared/components/status-badge.component';
import { isAllowedOfferStatusTransition } from '@app/features/offers/offer-state-machine';
import type { OfferResponseDto, UpdateOfferStatusDto } from '@app/shared/models';
import { OfferStatus } from '@app/shared/models';

const OFFER_STATUS_ORDER: string[] = [
  OfferStatus.DRAFT,
  OfferStatus.SENT,
  OfferStatus.VIEWED,
  OfferStatus.ACCEPTED,
  OfferStatus.REJECTED,
  OfferStatus.EXPIRED,
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offers-kanban',
  standalone: true,
  imports: [
    DragDropModule,
    RouterLink,
    StatusBadgeComponent,
    ...MAT_BUTTONS,
    ...MAT_BUTTON_TOGGLES,
  ],
  templateUrl: './offers-kanban.html',
  styleUrl: './offers-kanban.css',
})
export class OffersKanbanComponent {
  private readonly offersService = inject(OffersService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly itemsByStatus = signal<Record<string, OfferResponseDto[]>>({});
  readonly visibleStatuses = signal<string[]>([]);
  readonly statusFilterChecked = signal<Record<string, boolean>>({});

  private readonly data = rxResource({
    stream: () => this.offersService.getList({ page: 1, limit: 100 }),
  });

  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load offers';
    }

    return undefined;
  });

  readonly columns = computed(() => {
    const visible = this.visibleStatuses();
    const byStatus = this.itemsByStatus();

    return visible.map((status) => ({
      status,
      items: byStatus[status] ?? [],
    }));
  });

  readonly allListIds = computed(() => this.visibleStatuses());

  constructor() {
    effect(() => {
      const value = this.data.value();

      if (!value?.data) {
        return;
      }
      const byStatus: Record<string, OfferResponseDto[]> = {};

      for (const s of OFFER_STATUS_ORDER) {
        byStatus[s] = [];
      }
      for (const offer of value.data) {
        const s = offer.status as string;

        if (!byStatus[s]) {
          byStatus[s] = [];
        }
        byStatus[s].push(offer);
      }
      this.itemsByStatus.set(byStatus);

      if (this.visibleStatuses().length === 0) {
        this.visibleStatuses.set([...OFFER_STATUS_ORDER]);
        const checked: Record<string, boolean> = {};
        OFFER_STATUS_ORDER.forEach((s) => (checked[s] = true));
        this.statusFilterChecked.set(checked);
      }
    });
  }

  setFilter(status: string, checked: boolean): void {
    const current = this.visibleStatuses();

    if (checked) {
      if (!current.includes(status)) {
        this.visibleStatuses.set(
          [...current, status].sort(
            (a, b) => OFFER_STATUS_ORDER.indexOf(a) - OFFER_STATUS_ORDER.indexOf(b),
          ),
        );
      }
    } else {
      this.visibleStatuses.set(current.filter((s) => s !== status));
    }
    this.statusFilterChecked.update((m) => ({ ...m, [status]: checked }));
  }

  onDrop(event: CdkDragDrop<OfferResponseDto[]>, targetStatus: string): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const prevList = event.previousContainer.data;
    const currList = event.container.data;
    const offer = event.item.data as OfferResponseDto;
    const previousStatus = offer.status as string;

    if (previousStatus === targetStatus) {
      return;
    }

    if (!isAllowedOfferStatusTransition(previousStatus, targetStatus)) {
      this.toast.showError(`Invalid transition: ${previousStatus} → ${targetStatus}`);

      return;
    }

    transferArrayItem(prevList, currList, event.previousIndex, event.currentIndex);
    offer.status = targetStatus;
    this.itemsByStatus.update((m) => ({ ...m }));

    this.offersService
      .setStatus(offer.id, targetStatus as UpdateOfferStatusDto['status'])
      .subscribe({
        next: (updated) => {
          const idx = currList.findIndex((o) => o.id === updated.id);

          if (idx !== -1) {
            currList[idx] = updated;
          }
          this.itemsByStatus.update((m) => ({ ...m }));
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          transferArrayItem(currList, prevList, event.currentIndex, event.previousIndex);
          offer.status = previousStatus;
          this.itemsByStatus.update((m) => ({ ...m }));
          this.toast.showError(err?.error?.message ?? err?.message ?? 'Invalid status transition');
        },
      });
  }

  goToOffer(offer: OfferResponseDto): void {
    this.router.navigate(['/app/offers', offer.id]);
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
    } catch {
      return iso;
    }
  }

  protected readonly OfferStatus = OfferStatus;
}
