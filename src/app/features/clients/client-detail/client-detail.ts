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
import { map, switchMap } from 'rxjs/operators';

import { ActivitiesService } from '@app/services/activities.service';
import { ClientsService } from '@app/services/clients.service';
import { CommentsService } from '@app/services/comments.service';
import { TagsService } from '@app/services/tags.service';
import {
  BookingStatusChipComponent,
  LeadStatusChipComponent,
  OfferStatusChipComponent,
  RequestStatusChipComponent,
  TagSelectorComponent,
} from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS, MAT_TABS } from '@app/shared/material-imports';
import { ClientType, EntityType } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type {
  BookingSummaryDto,
  ClientResponseDto,
  LeadResponseDto,
  OfferSummaryDto,
  TravelRequestSummaryDto,
} from '@app/shared/models';
const TYPE_LABEL: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'Individual',
  [ClientType.COMPANY]: 'Company',
  [ClientType.B2B_AGENT]: 'B2B Agent',
};

type ClientHistoryTab = 'leads' | 'requests' | 'offers' | 'bookings';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-detail',
  imports: [
    RouterLink,
    TagSelectorComponent,
    LeadStatusChipComponent,
    RequestStatusChipComponent,
    OfferStatusChipComponent,
    BookingStatusChipComponent,
    ...MAT_BUTTONS,
    ...MAT_TABS,
    PageHeading,
  ],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.scss',
  host: {
    class: 'pv-4',
  },
})
export class ClientDetailComponent {
  protected readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly commentsService = inject(CommentsService);
  private readonly tagsService = inject(TagsService);
  private readonly toast = inject(ToastService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<ClientResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.clientsService.getById(id);
    },
  });

  private readonly tagsVersion = signal(0);

  private readonly entityTagsData = rxResource({
    params: (): [string | null, number] => [this.routeId() ?? null, this.tagsVersion()],
    stream: ({ params }) => {
      const [clientId] = params;

      if (clientId === null) {
        return EMPTY;
      }

      return this.tagsService.findAll({
        entityType: EntityType.Client,
        entityId: clientId,
      });
    },
  });

  // Lazy-loaded tab data
  private readonly leadsLoadTrigger = signal(0);
  private readonly leadsData = rxResource<LeadResponseDto[], [string | null, number]>({
    params: () => [this.routeId() ?? null, this.leadsLoadTrigger()] as [string | null, number],
    stream: ({ params }) => {
      const [clientId, trigger] = params;

      if (clientId === null || trigger === 0) {
        return EMPTY;
      }

      return this.clientsService.getLeads(clientId, { page: 0, limit: 20 }).pipe(map((r) => r.items));
    },
  });

  private readonly requestsLoadTrigger = signal(0);
  private readonly requestsData = rxResource<TravelRequestSummaryDto[], [string | null, number]>({
    params: () => [this.routeId() ?? null, this.requestsLoadTrigger()] as [string | null, number],
    stream: ({ params }) => {
      const [clientId, trigger] = params;

      if (clientId === null || trigger === 0) {
        return EMPTY;
      }

      return this.clientsService
        .getRequests(clientId, { page: 0, limit: 20 })
        .pipe(map((r) => r.items));
    },
  });

  private readonly offersLoadTrigger = signal(0);
  private readonly offersData = rxResource<OfferSummaryDto[], [string | null, number]>({
    params: () => [this.routeId() ?? null, this.offersLoadTrigger()] as [string | null, number],
    stream: ({ params }) => {
      const [clientId, trigger] = params;

      if (clientId === null || trigger === 0) {
        return EMPTY;
      }

      return this.clientsService.getOffers(clientId, { page: 0, limit: 20 }).pipe(map((r) => r.items));
    },
  });

  private readonly bookingsLoadTrigger = signal(0);
  private readonly bookingsData = rxResource<BookingSummaryDto[], [string | null, number]>({
    params: () => [this.routeId() ?? null, this.bookingsLoadTrigger()] as [string | null, number],
    stream: ({ params }) => {
      const [clientId, trigger] = params;

      if (clientId === null || trigger === 0) {
        return EMPTY;
      }

      return this.clientsService
        .getBookings(clientId, { page: 0, limit: 20 })
        .pipe(map((r) => r.items));
    },
  });

  readonly typeLabel = TYPE_LABEL;
  readonly client = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly tagsLoading = computed(() => this.entityTagsData.isLoading());
  readonly tagsSaveLoading = signal(false);

  readonly activeTab = signal<ClientHistoryTab>('leads');
  readonly selectedTabIndex = signal(0);

  readonly leads = computed(() => this.leadsData.value() ?? []);
  readonly leadsLoading = computed(() => this.leadsData.isLoading());

  readonly requests = computed(() => this.requestsData.value() ?? []);
  readonly requestsLoading = computed(() => this.requestsData.isLoading());

  readonly offers = computed(() => this.offersData.value() ?? []);
  readonly offersLoading = computed(() => this.offersData.isLoading());

  readonly bookings = computed(() => this.bookingsData.value() ?? []);
  readonly bookingsLoading = computed(() => this.bookingsData.isLoading());

  readonly clientTags = computed<string[]>(() => {
    const tags = this.entityTagsData.value() ?? [];

    return tags.map((t) => t.name);
  });

  readonly entityTags = computed(() => this.entityTagsData.value() ?? []);

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/clients']);
      }
    });

    // Load the first tab (Leads) on initialization
    effect(() => {
      const clientId = this.routeId();

      if (clientId && this.leadsLoadTrigger() === 0) {
        this.leadsLoadTrigger.set(1);
      }
    });
  }

  onSelectedTabChange(index: number): void {
    const tabs: ClientHistoryTab[] = ['leads', 'requests', 'offers', 'bookings'];
    const tab = tabs[index];

    if (!tab) {
      return;
    }

    this.activeTab.set(tab);
    this.selectedTabIndex.set(index);

    // Lazy-load tab data on first activation
    if (tab === 'leads' && this.leadsLoadTrigger() === 0) {
      this.leadsLoadTrigger.set(1);
    } else if (tab === 'requests' && this.requestsLoadTrigger() === 0) {
      this.requestsLoadTrigger.set(1);
    } else if (tab === 'offers' && this.offersLoadTrigger() === 0) {
      this.offersLoadTrigger.set(1);
    } else if (tab === 'bookings' && this.bookingsLoadTrigger() === 0) {
      this.bookingsLoadTrigger.set(1);
    }
  }

  onTagsChange(tags: string[]): void {
    const c = this.client();

    if (!c || this.tagsSaveLoading()) {
      return;
    }
    const current = this.clientTags();
    const added = tags.filter((n) => !current.includes(n));
    const removed = current.filter((n) => !tags.includes(n));
    const entityTags = this.entityTags();

    if (added.length === 0 && removed.length === 0) {
      return;
    }

    this.tagsSaveLoading.set(true);
    const done = (): void => {
      this.tagsVersion.update((v) => v + 1);
      this.tagsSaveLoading.set(false);
    };

    let pending = added.length + removed.length;
    const checkDone = (): void => {
      pending -= 1;

      if (pending === 0) {
        done();
      }
    };

    for (const name of added) {
      this.tagsService
        .create({ name })
        .pipe(
          switchMap((tag) =>
            this.tagsService.attach(tag.id, {
              entityType: EntityType.Client,
              entityId: c.id,
            }),
          ),
        )
        .subscribe({
          next: checkDone,
          error: () => {
            this.toast.showError('Failed to add tag');
            checkDone();
          },
        });
    }
    for (const name of removed) {
      const tag = entityTags.find((t) => t.name === name);

      if (!tag) {
        checkDone();
        continue;
      }
      this.tagsService.detach(tag.id, EntityType.Client, c.id).subscribe({
        next: checkDone,
        error: () => {
          this.toast.showError('Failed to remove tag');
          checkDone();
        },
      });
    }
    if (pending === 0) {
      this.tagsSaveLoading.set(false);
    }
  }

  goToLead(lead: LeadResponseDto): void {
    this.router.navigate(['/app/leads', lead.id]);
  }

  goToRequest(req: TravelRequestSummaryDto): void {
    if (req.leadId) {
      this.router.navigate(['/app/leads', req.leadId]);
    }
  }

  goToOffer(offer: OfferSummaryDto): void {
    this.router.navigate(['/app/offers', offer.id]);
  }

  goToBooking(booking: BookingSummaryDto): void {
    this.router.navigate(['/app/bookings', booking.id]);
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  formatDateShort(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }
}
