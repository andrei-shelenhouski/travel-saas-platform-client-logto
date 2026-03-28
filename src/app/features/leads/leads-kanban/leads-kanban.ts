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

import { LeadsService } from '@app/services/leads.service';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS } from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';
import { StatusBadgeComponent } from '@app/shared/components/status-badge.component';
import type { LeadResponseDto } from '@app/shared/models';
import { LeadStatus } from '@app/shared/models';

const LEAD_STATUS_ORDER: string[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.LOST,
  LeadStatus.CONVERTED,
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-leads-kanban',
  standalone: true,
  imports: [
    DragDropModule,
    RouterLink,
    StatusBadgeComponent,
    ...MAT_BUTTONS,
    ...MAT_BUTTON_TOGGLES,
  ],
  templateUrl: './leads-kanban.html',
  styleUrl: './leads-kanban.css',
})
export class LeadsKanbanComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Status -> list of leads. Mutable arrays for CDK binding. */
  readonly itemsByStatus = signal<Record<string, LeadResponseDto[]>>({});
  /** Which status columns are visible (filter). */
  readonly visibleStatuses = signal<string[]>([]);
  readonly statusFilterChecked = signal<Record<string, boolean>>({});

  private readonly data = rxResource({
    stream: () => this.leadsService.findAll({ page: 1, limit: 100 }),
  });

  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load leads';
    }

    return undefined;
  });

  /** Column config for template: status + items array. */
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
      const byStatus: Record<string, LeadResponseDto[]> = {};

      for (const s of LEAD_STATUS_ORDER) {
        byStatus[s] = [];
      }
      for (const lead of value.data) {
        const s = lead.status as string;

        if (!byStatus[s]) {
          byStatus[s] = [];
        }
        byStatus[s].push(lead);
      }
      this.itemsByStatus.set(byStatus);

      if (this.visibleStatuses().length === 0) {
        this.visibleStatuses.set([...LEAD_STATUS_ORDER]);
        const checked: Record<string, boolean> = {};
        LEAD_STATUS_ORDER.forEach((s) => (checked[s] = true));
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
            (a, b) => LEAD_STATUS_ORDER.indexOf(a) - LEAD_STATUS_ORDER.indexOf(b),
          ),
        );
      }
    } else {
      this.visibleStatuses.set(current.filter((s) => s !== status));
    }
    this.statusFilterChecked.update((m) => ({ ...m, [status]: checked }));
  }

  onDrop(event: CdkDragDrop<LeadResponseDto[]>, targetStatus: string): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const prevList = event.previousContainer.data;
    const currList = event.container.data;
    const lead = event.item.data as LeadResponseDto;
    const previousStatus = lead.status as string;

    if (previousStatus === targetStatus) {
      return;
    }

    transferArrayItem(prevList, currList, event.previousIndex, event.currentIndex);
    lead.status = targetStatus;
    this.itemsByStatus.update((m) => ({ ...m }));

    this.leadsService.updateStatus(lead.id, { status: targetStatus as LeadStatus }).subscribe({
      next: (updated) => {
        const idx = currList.findIndex((l) => l.id === updated.id);

        if (idx !== -1) {
          currList[idx] = updated;
        }
        this.itemsByStatus.update((m) => ({ ...m }));
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        transferArrayItem(currList, prevList, event.currentIndex, event.previousIndex);
        lead.status = previousStatus;
        this.itemsByStatus.update((m) => ({ ...m }));
        this.toast.showError(err?.error?.message ?? err?.message ?? 'Invalid status transition');
      },
    });
  }

  goToLead(lead: LeadResponseDto): void {
    this.router.navigate(['/app/leads', lead.id]);
  }

  getStatusLabel(s: string): string {
    return s.replace(/_/g, ' ');
  }

  protected readonly LeadStatus = LeadStatus;
}
