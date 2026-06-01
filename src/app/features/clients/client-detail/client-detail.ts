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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPTY, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { AuthService } from '@app/auth/auth.service';
import { ContractFormDialogComponent } from '@app/features/clients/contract-form-dialog/contract-form-dialog';
import { InvoiceStatusChipComponent } from '@app/features/invoices/invoice-status-chip/invoice-status-chip';
import { ActivitiesService } from '@app/services/activities.service';
import { ClientsService } from '@app/services/clients.service';
import { CommentsService } from '@app/services/comments.service';
import { ContractsService } from '@app/services/contracts.service';
import { CustomFieldsService } from '@app/services/custom-fields.service';
import { TagsService } from '@app/services/tags.service';
import {
  BookingStatusChipComponent,
  CustomFieldsSectionComponent,
  LeadStatusChipComponent,
  OfferStatusChipComponent,
  RequestStatusChipComponent,
} from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { MAT_BUTTONS, MAT_MENU, MAT_TABS } from '@app/shared/material-imports';
import {
  ClientType,
  ContractStatus,
  EntityType,
  PermissionKey,
  SignatureMethod,
} from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { ClientProfileCardComponent } from './client-profile-card/client-profile-card';
import { FamilySectionComponent } from './family-section/family-section';
import { TravelerProfileSectionComponent } from './traveler-profile-section/traveler-profile-section';

import type {
  BookingSummaryDto,
  ClientResponseDto,
  ContractResponseDto,
  CustomFieldValueDto,
  InvoiceResponseDto,
  LeadResponseDto,
  OfferSummaryDto,
  TravelRequestSummaryDto,
} from '@app/shared/models';

const TYPE_LABEL: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'Физ. лицо',
  [ClientType.COMPANY]: 'Компания',
  [ClientType.B2B_AGENT]: 'B2B агент',
};

const CONTRACT_STATUS_CLASS: Record<string, string> = {
  [ContractStatus.ACTIVE]: 'contract-status contract-status-active',
  [ContractStatus.EXPIRED]: 'contract-status contract-status-expired',
  [ContractStatus.TERMINATED]: 'contract-status contract-status-terminated',
};

const SIGNATURE_METHOD_LABEL: Record<string, string> = {
  [SignatureMethod.ORIGINAL_MAIL]: 'Почта',
  [SignatureMethod.ORIGINAL_COURIER]: 'Курьер',
  [SignatureMethod.DIGITAL_PODPIS]: 'Podpis.by',
  [SignatureMethod.OTHER]: 'Другое',
};

type ClientHistoryTab = 'leads' | 'requests' | 'offers' | 'bookings' | 'invoices' | 'contracts';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-detail',
  imports: [
    RouterLink,
    LeadStatusChipComponent,
    RequestStatusChipComponent,
    OfferStatusChipComponent,
    BookingStatusChipComponent,
    InvoiceStatusChipComponent,
    CustomFieldsSectionComponent,
    MatPaginatorModule,
    ...MAT_BUTTONS,
    ...MAT_MENU,
    ...MAT_TABS,
    PageHeading,
    ClientProfileCardComponent,
    FamilySectionComponent,
    TravelerProfileSectionComponent,
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
  private readonly authService = inject(AuthService);
  private readonly clientsService = inject(ClientsService);
  private readonly contractsService = inject(ContractsService);
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly commentsService = inject(CommentsService);
  private readonly tagsService = inject(TagsService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
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
        return of([]);
      }

      return this.clientsService
        .getLeads(clientId, { page: 1, limit: 20 })
        .pipe(map((r) => r.items));
    },
  });

  private readonly requestsLoadTrigger = signal(0);
  private readonly requestsData = rxResource<TravelRequestSummaryDto[], [string | null, number]>({
    params: () => [this.routeId() ?? null, this.requestsLoadTrigger()] as [string | null, number],
    stream: ({ params }) => {
      const [clientId, trigger] = params;

      if (clientId === null || trigger === 0) {
        return of([]);
      }

      return this.clientsService
        .getRequests(clientId, { page: 1, limit: 20 })
        .pipe(map((r) => r.items));
    },
  });

  private readonly offersLoadTrigger = signal(0);
  private readonly offersData = rxResource<OfferSummaryDto[], [string | null, number]>({
    params: () => [this.routeId() ?? null, this.offersLoadTrigger()] as [string | null, number],
    stream: ({ params }) => {
      const [clientId, trigger] = params;

      if (clientId === null || trigger === 0) {
        return of([]);
      }

      return this.clientsService
        .getOffers(clientId, { page: 1, limit: 20 })
        .pipe(map((r) => r.items));
    },
  });

  private readonly bookingsLoadTrigger = signal(0);
  private readonly bookingsData = rxResource<BookingSummaryDto[], [string | null, number]>({
    params: () => [this.routeId() ?? null, this.bookingsLoadTrigger()] as [string | null, number],
    stream: ({ params }) => {
      const [clientId, trigger] = params;

      if (clientId === null || trigger === 0) {
        return of([]);
      }

      return this.clientsService
        .getBookings(clientId, { page: 1, limit: 20 })
        .pipe(map((r) => r.items));
    },
  });

  private readonly invoicesLoadTrigger = signal(0);
  private readonly invoicesData = rxResource<InvoiceResponseDto[], [string | null, number]>({
    params: () => [this.routeId() ?? null, this.invoicesLoadTrigger()] as [string | null, number],
    stream: ({ params }) => {
      const [clientId, trigger] = params;

      if (clientId === null || trigger === 0) {
        return of([]);
      }

      return this.clientsService
        .getInvoices(clientId, { page: 1, limit: 20 })
        .pipe(map((r) => r.items));
    },
  });

  readonly contractsPageSize = 20;
  readonly contractsPageIndex = signal(0);

  private readonly contractsLoadTrigger = signal(0);
  private readonly contractsRefreshTrigger = signal(0);
  private readonly contractsData = rxResource<
    { items: ContractResponseDto[]; total: number },
    [string | null, number, number, number]
  >({
    params: () =>
      [
        this.routeId() ?? null,
        this.contractsLoadTrigger(),
        this.contractsPageIndex(),
        this.contractsRefreshTrigger(),
      ] as [string | null, number, number, number],
    stream: ({ params }) => {
      const [clientId, trigger, pageIndex] = params;

      if (clientId === null || trigger === 0) {
        return of({ items: [], total: 0 });
      }

      return this.contractsService.getByClient(clientId, {
        page: pageIndex + 1,
        limit: this.contractsPageSize,
      });
    },
  });

  private readonly customFieldsData = rxResource<CustomFieldValueDto[], string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.customFieldsService.getClientValues(id);
    },
  });

  readonly typeLabel = TYPE_LABEL;
  readonly client = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly tagsLoading = computed(() => this.entityTagsData.isLoading());
  readonly tagsSaveLoading = signal(false);

  readonly selectedTabIndex = signal(0);

  readonly leads = computed(() => this.leadsData.value() ?? []);
  readonly leadsLoading = computed(() => this.leadsData.isLoading());

  readonly requests = computed(() => this.requestsData.value() ?? []);
  readonly requestsLoading = computed(() => this.requestsData.isLoading());

  readonly offers = computed(() => this.offersData.value() ?? []);
  readonly offersLoading = computed(() => this.offersData.isLoading());

  readonly bookings = computed(() => this.bookingsData.value() ?? []);
  readonly bookingsLoading = computed(() => this.bookingsData.isLoading());

  readonly invoices = computed(() => this.invoicesData.value() ?? []);
  readonly invoicesLoading = computed(() => this.invoicesData.isLoading());

  readonly isB2BAgent = computed(() => this.client()?.type === ClientType.B2B_AGENT);
  readonly canViewContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_VIEW),
  );
  readonly canCreateContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_CREATE),
  );
  readonly canUpdateContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_UPDATE),
  );
  readonly contracts = computed(() => this.contractsData.value()?.items ?? []);
  readonly contractsTotal = computed(() => this.contractsData.value()?.total ?? 0);
  readonly contractsLoading = computed(() => this.contractsData.isLoading());
  readonly customFieldsSaving = signal(false);
  readonly customFields = computed(() => {
    return (this.customFieldsData.value() ?? []).map((field, index) => ({
      definitionId: field.definitionId,
      name: field.name,
      fieldType: field.fieldType,
      options: field.options ?? [],
      value: field.value ?? '',
      required: field.required ?? false,
      sortOrder: field.sortOrder ?? index + 1,
    }));
  });

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
    const tabs: ClientHistoryTab[] = ['leads', 'requests', 'offers', 'bookings', 'invoices'];

    if (this.isB2BAgent() && this.canViewContracts()) {
      tabs.push('contracts');
    }

    const tab = tabs[index];

    if (!tab) {
      return;
    }

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
    } else if (tab === 'invoices' && this.invoicesLoadTrigger() === 0) {
      this.invoicesLoadTrigger.set(1);
    } else if (tab === 'contracts' && this.contractsLoadTrigger() === 0) {
      this.contractsLoadTrigger.set(1);
    }
  }

  onContractsPageChange(event: PageEvent): void {
    this.contractsPageIndex.set(event.pageIndex);
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
            this.toast.showError('Не удалось добавить тег');
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
          this.toast.showError('Не удалось удалить тег');
          checkDone();
        },
      });
    }
    if (pending === 0) {
      this.tagsSaveLoading.set(false);
    }
  }

  onSaveCustomFields(values: Record<string, string>): void {
    const c = this.client();

    if (!c) {
      return;
    }

    this.customFieldsSaving.set(true);
    this.customFieldsService
      .upsertClientValues(c.id, { values })
      .pipe(
        map((updatedValues) => {
          this.customFieldsData.set(updatedValues);

          return updatedValues;
        }),
      )
      .subscribe({
        next: () => {
          this.customFieldsSaving.set(false);
          this.toast.showSuccess('Дополнительные поля сохранены');
        },
        error: (err) => {
          this.customFieldsSaving.set(false);
          this.toast.showError(err.error?.message ?? 'Не удалось сохранить дополнительные поля');
        },
      });
  }

  readonly resolvedPersonId = signal<string | null>(null);

  protected onTravelerPersonIdResolved(personId: string): void {
    this.resolvedPersonId.set(personId);
  }

  protected onTravelerPrimaryContactChanged(): void {
    this.data.reload();
  }

  goToLead(lead: LeadResponseDto): void {
    this.router.navigate(['/app/leads', lead.id]);
  }

  goToRequest(req: TravelRequestSummaryDto): void {
    this.router.navigate(['/app/requests', req.id]);
  }

  goToOffer(offer: OfferSummaryDto): void {
    this.router.navigate(['/app/offers', offer.id]);
  }

  goToBooking(booking: BookingSummaryDto): void {
    this.router.navigate(['/app/bookings', booking.id]);
  }

  goToInvoice(invoice: InvoiceResponseDto): void {
    this.router.navigate(['/app/invoices', invoice.id]);
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

  contractStatusClass(status: string | null | undefined): string {
    if (!status) {
      return 'contract-status contract-status-expired';
    }

    return CONTRACT_STATUS_CLASS[status] ?? 'contract-status contract-status-expired';
  }

  contractSignatureLabel(method: string | null | undefined): string {
    if (!method) {
      return '—';
    }

    return SIGNATURE_METHOD_LABEL[method] ?? method;
  }

  canManageContract(contract: ContractResponseDto): boolean {
    return this.canUpdateContracts() && contract.status === ContractStatus.ACTIVE;
  }

  openCreateContractDialog(): void {
    const clientId = this.client()?.id;

    if (!clientId) {
      return;
    }

    this.dialog
      .open(ContractFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: {
          clientId,
          mode: 'create',
        },
      })
      .afterClosed()
      .subscribe((created) => {
        if (!created) {
          return;
        }

        this.refreshContracts();
      });
  }

  openEditContractDialog(contract: ContractResponseDto): void {
    if (!this.canManageContract(contract)) {
      return;
    }

    this.dialog
      .open(ContractFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: {
          clientId: contract.clientId,
          mode: 'edit',
          contract,
        },
      })
      .afterClosed()
      .subscribe((updated) => {
        if (!updated) {
          return;
        }

        this.refreshContracts();
      });
  }

  terminateContract(contract: ContractResponseDto): void {
    if (!this.canManageContract(contract)) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Расторгнуть договор',
        message: `Вы уверены, что хотите расторгнуть договор ${contract.contractNumber}? Это действие необратимо.`,
        confirmLabel: 'Расторгнуть',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.contractsService.terminate(contract.id).subscribe({
          next: () => {
            this.refreshContracts();
          },
          error: () => {
            this.toast.showError('Не удалось расторгнуть договор');
          },
        });
      });
  }

  private refreshContracts(): void {
    if (this.contractsLoadTrigger() === 0) {
      this.contractsLoadTrigger.set(1);
    }

    this.contractsRefreshTrigger.update((value) => value + 1);
  }
}
