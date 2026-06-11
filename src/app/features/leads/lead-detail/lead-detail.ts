import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EMPTY, forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';
import { AssignDialogComponent } from '@app/features/leads/assign-dialog/assign-dialog';
import {
  DeleteLeadDialogComponent,
  DeleteLeadDialogResult,
} from '@app/features/leads/delete-lead-dialog/delete-lead-dialog';
import { LeadDetailHeaderComponent } from '@app/features/leads/lead-detail/lead-detail-header/lead-detail-header';
import { LeadDetailOffersSectionComponent } from '@app/features/leads/lead-detail/lead-detail-offers-section/lead-detail-offers-section';
import { LeadJourneyStepperComponent } from '@app/features/leads/lead-detail/lead-journey-stepper/lead-journey-stepper';
import { LeadInvoicesTableComponent } from '@app/features/leads/lead-detail/lead-invoices-table/lead-invoices-table';
import { LinkLeadClientDialogComponent } from '@app/features/leads/link-lead-client-dialog/link-lead-client-dialog';
import { PromoteLeadClientDialogComponent } from '@app/features/leads/promote-lead-client-dialog/promote-lead-client-dialog';
import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { CustomFieldsService } from '@app/services/custom-fields.service';
import { LeadsService } from '@app/services/leads.service';
import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { LoadingStateComponent, PageContentComponent } from '@app/shared/components';
import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';
import { CustomFieldsSectionComponent } from '@app/shared/components/custom-fields-section/custom-fields-section';
import { LeadStatus } from '@app/shared/models';
import { MarkdownPipe } from '@app/shared/pipes/markdown-pipe';

import { atLeastOneContactValidator } from '../leads.validators';

import type {
  ActivityListResponseDto,
  ActivityResponseDto,
  BookingResponseDto,
  ContactResponseDto,
  CustomFieldValueDto,
  LeadBookingDto,
  LeadResponseDto,
  OfferResponseDto,
  PaginatedInvoiceResponseDto,
} from '@app/shared/models';
import type { LeadAction } from './lead-detail-header/lead-detail-header';

type LeadDetailLoadData = {
  lead: LeadResponseDto;
  offers: OfferResponseDto[];
  activities: ActivityListResponseDto;
};

const SALES_ROLES = new Set(['AGENT', 'SALES_AGENT', 'ADMIN', 'MANAGER']);
const TERMINAL_STATUSES = new Set<string>([LeadStatus.WON, LeadStatus.LOST, LeadStatus.EXPIRED]);
const ACTIVITY_PAGE_SIZE = 20;

function formatDateShort(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function formatDateRange(from: string | null | undefined, to: string | null | undefined): string {
  const fromText = formatDateShort(from ?? null);
  const toText = formatDateShort(to ?? null);

  if (fromText === '—' && toText === '—') {
    return '—';
  }

  if (fromText !== '—' && toText !== '—') {
    return `${fromText} - ${toText}`;
  }

  return fromText === '—' ? toText : fromText;
}

function getAgentInitials(name: string | null): string {
  if (!name) {
    return 'NA';
  }
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'NA';
  }

  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

const ACTIVITY_ICON_MAP: [string, string][] = [
  ['create', 'add_circle'],
  ['status', 'flag'],
  ['assign', 'person_add'],
  ['offer', 'description'],
  ['contact', 'person'],
];

function getActivityIcon(type: string): string {
  const n = type.toLowerCase();

  return ACTIVITY_ICON_MAP.find(([k]) => n.includes(k))?.[1] ?? 'history';
}

const ACTION_TARGET_STATUS: Partial<Record<LeadAction, LeadStatus>> = {
  to_in_progress: LeadStatus.IN_PROGRESS,
  to_offer_sent: LeadStatus.OFFER_SENT,
  mark_lost: LeadStatus.LOST,
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lead-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    CustomFieldsSectionComponent,
    ClientTypeBadgeComponent,
    BookingStatusChipComponent,
    LeadDetailHeaderComponent,
    LeadDetailOffersSectionComponent,
    LeadJourneyStepperComponent,
    LeadInvoicesTableComponent,
    MarkdownPipe,
    LoadingStateComponent,
    PageContentComponent,
  ],
  templateUrl: './lead-detail.html',
  styleUrl: './lead-detail.scss',
})
export class LeadDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly leadsService = inject(LeadsService);
  private readonly offersService = inject(OffersService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly clientsService = inject(ClientsService);
  private readonly bookingsService = inject(BookingsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly permissions = inject(PermissionService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));
  private readonly travelDetailsData = signal<LeadResponseDto | null>(null);

  private readonly data = rxResource<LeadDetailLoadData, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return forkJoin({
        lead: this.leadsService.getById(id),
        offers: this.offersService
          .getList({ leadId: id, limit: 100 })
          .pipe(map((res) => res.items)),
        activities: this.leadsService.getActivity(id, {
          page: 1,
          limit: ACTIVITY_PAGE_SIZE,
        }),
      });
    },
  });

  private readonly membersData = rxResource({
    stream: () => {
      return this.membersService.findAll();
    },
  });

  private readonly customFieldsData = rxResource<CustomFieldValueDto[], string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.customFieldsService.getLeadValues(id);
    },
  });

  protected readonly customFieldsSection = viewChild(CustomFieldsSectionComponent);

  private readonly clientContactsData = rxResource<ContactResponseDto[], string | null>({
    params: (): string | null => this.lead()?.clientId ?? null,
    stream: ({ params }) => {
      if (!params) {
        return of([]);
      }

      return this.clientsService.listContacts(params);
    },
    defaultValue: [],
  });

  private readonly bookingDetailData = rxResource<BookingResponseDto | null, string | null>({
    params: () => this.lead()?.booking?.id ?? null,
    stream: ({ params }) => {
      if (!params) {
        return of(null);
      }

      return this.bookingsService.getById(params);
    },
    defaultValue: null,
  });

  private readonly bookingInvoicesData = rxResource<
    PaginatedInvoiceResponseDto | null,
    string | null
  >({
    params: () => this.lead()?.booking?.id ?? null,
    stream: ({ params }) => {
      if (!params) {
        return of(null);
      }

      return this.bookingsService.listInvoices(params, { limit: 50 });
    },
    defaultValue: null,
  });

  protected readonly lead = computed(
    () => this.travelDetailsData() ?? this.data.value()?.lead ?? null,
  );
  protected readonly clientContacts = computed(() => this.clientContactsData.value() ?? []);
  protected readonly contactPerson = computed(() => {
    const cpId = this.lead()?.contactPersonId;

    if (!cpId) {
      return null;
    }

    return this.clientContacts().find((c) => c.id === cpId) ?? null;
  });

  protected readonly offers = computed(() => this.data.value()?.offers ?? []);
  protected readonly customFields = computed(() => {
    return (this.customFieldsData.value() ?? []).map((field, index) => ({
      definitionId: field.definitionId,
      name: field.name,
      fieldType: field.fieldType,
      options: field.options ?? [],
      value: field.value ?? '',
      required: false,
      sortOrder: index + 1,
    }));
  });
  protected readonly loading = computed(() => this.data.isLoading());
  protected readonly error = computed(() => this.data.error());

  protected readonly canReassign = computed(() => {
    return this.permissions.canAssignLead();
  });

  protected readonly canDeleteLeadDetail = this.permissions.canDeleteLead;

  protected readonly isDeletedLead = computed(() => Boolean(this.lead()?.deletedAt));

  protected readonly canManageLeadClient = computed(() => {
    const lead = this.lead();

    if (!lead) {
      return false;
    }

    if (lead.deletedAt) {
      return false;
    }

    return !this.isTerminalStatus(lead.status);
  });

  protected readonly visibleActions = computed<LeadAction[]>(() => {
    const l = this.lead();

    if (!l) {
      return [];
    }

    return this.getAvailableActions(l.status).filter((action) => {
      if (action === 'assign') {
        return this.canReassign();
      }

      return true;
    });
  });

  protected readonly isTerminalLead = computed(() => {
    const l = this.lead();

    return l ? this.isTerminalStatus(l.status) : true;
  });

  protected readonly linkedBooking = computed((): LeadBookingDto | null => {
    return this.lead()?.booking ?? null;
  });

  protected readonly bookingDetail = computed(() => this.bookingDetailData.value() ?? null);
  protected readonly bookingInvoices = computed(
    () => this.bookingInvoicesData.value()?.items ?? [],
  );
  protected readonly bookingDetailLoading = computed(() => this.bookingDetailData.isLoading());
  protected readonly bookingInvoicesLoading = computed(() => this.bookingInvoicesData.isLoading());

  protected readonly activityItems = signal<ActivityResponseDto[]>([]);
  protected readonly activityTotal = signal(0);
  protected readonly activityPage = signal(1);
  protected readonly loadingMoreActivity = signal(false);
  protected readonly savingCustomFields = signal(false);

  protected readonly canLoadMoreActivity = computed(() => {
    return this.activityItems().length < this.activityTotal();
  });

  protected readonly statusActionLoading = signal<LeadAction | null>(null);
  protected readonly assignLoading = signal(false);
  protected readonly savingTravelDetails = signal(false);
  protected readonly editingTravelDetails = signal(false);

  protected readonly travelForm = this.formBuilder.group(
    {
      contactPhone: this.formBuilder.control<string>('', {
        validators: [Validators.pattern(/^\+?\d{10,15}$/)],
      }),
      contactEmail: this.formBuilder.control<string>('', {
        validators: [Validators.email],
      }),
      contactTelegram: this.formBuilder.control<string>('', {
        validators: [Validators.maxLength(60)],
      }),
      destination: this.formBuilder.control<string>(''),
      departDateFrom: this.formBuilder.control<string>(''),
      departDateTo: this.formBuilder.control<string>(''),
      returnDateFrom: this.formBuilder.control<string>(''),
      returnDateTo: this.formBuilder.control<string>(''),
      adults: this.formBuilder.control<number | null>(null),
      children: this.formBuilder.control<number | null>(null),
      notes: this.formBuilder.control<string>(''),
    },
    { validators: [atLeastOneContactValidator] },
  );

  protected readonly filteredAgents = computed(() => {
    return (this.membersData.value() ?? []).filter((member) => {
      return member.active && SALES_ROLES.has(member.role);
    });
  });

  private readonly activityActorNameByUserId = computed(() => {
    const actorNameByUserId = new Map<string, string>();

    for (const member of this.membersData.value() ?? []) {
      const userId = member.userId.trim();
      const displayName = member.name.trim();

      if (!userId || !displayName) {
        continue;
      }

      actorNameByUserId.set(userId, displayName);
    }

    return actorNameByUserId;
  });

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        void this.router.navigate(['/app/leads']);
      }
    });

    effect(() => {
      const value = this.data.value();

      if (!value) {
        return;
      }

      this.travelDetailsData.set(value.lead);
      this.activityPage.set(1);
      this.activityTotal.set(value.activities.total ?? value.activities.items.length);

      const ordered = [...value.activities.items].sort((left, right) => {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });

      this.activityItems.set(ordered);
      this.patchTravelForm(value.lead);
      this.editingTravelDetails.set(false);
    });
  }

  protected getAvailableActions(status: string): LeadAction[] {
    switch (status) {
      case LeadStatus.NEW:
        return ['assign', 'to_in_progress', 'mark_lost'];
      case LeadStatus.ASSIGNED:
        return ['to_in_progress', 'mark_lost'];
      case LeadStatus.IN_PROGRESS:
        return ['to_offer_sent', 'mark_lost'];
      case LeadStatus.OFFER_SENT:
        return ['mark_lost'];
      default:
        return [];
    }
  }

  protected applyAction(action: LeadAction): void {
    const lead = this.lead();

    if (!lead) {
      return;
    }

    if (action === 'assign') {
      this.openAssignDialog();

      return;
    }

    const targetStatus = ACTION_TARGET_STATUS[action];

    if (!targetStatus) {
      return;
    }

    if (this.customFields().length > 0) {
      const section = this.customFieldsSection();

      if (section && !section.ensureRequiredFieldsFilledForStatusChange()) {
        return;
      }
    }

    this.statusActionLoading.set(action);
    this.leadsService.updateStatus(lead.id, { status: targetStatus }).subscribe({
      next: (updated) => {
        this.travelDetailsData.set(updated);
        this.snackBar.open('Статус лида обновлён', 'Close', { duration: 4000 });
      },
      error: (err: unknown) => {
        this.snackBar.open(this.getErrorMessage(err, 'Не удалось обновить статус'), 'Close', {
          duration: 5000,
        });
      },
      complete: () => {
        this.statusActionLoading.set(null);
      },
    });
  }

  protected saveCustomFields(values: Record<string, string>): void {
    const lead = this.lead();

    if (!lead) {
      return;
    }

    this.savingCustomFields.set(true);
    this.customFieldsService
      .upsertLeadValues(lead.id, { values })
      .pipe(finalize(() => this.savingCustomFields.set(false)))
      .subscribe({
        next: (updatedValues) => {
          this.customFieldsData.set(updatedValues);
          this.snackBar.open('Дополнительные поля сохранены', 'Close', { duration: 4000 });
        },
        error: (err: unknown) => {
          this.snackBar.open(
            this.getErrorMessage(err, 'Не удалось сохранить дополнительные поля'),
            'Close',
            { duration: 5000 },
          );
        },
      });
  }

  protected openAssignDialog(): void {
    const lead = this.lead();

    if (!lead || this.assignLoading()) {
      return;
    }

    const dialogRef = this.dialog.open(AssignDialogComponent, {
      width: '480px',
      data: {
        agents: this.filteredAgents(),
        initialSelectedAgentId: lead.assignedAgentId ?? null,
      },
    });

    dialogRef.afterClosed().subscribe((agentId: string | undefined) => {
      if (agentId) {
        this.confirmAssign(agentId);
      }
    });
  }

  protected confirmAssign(agentId: string): void {
    const lead = this.lead();

    if (!lead || !agentId || this.assignLoading()) {
      return;
    }

    this.assignLoading.set(true);
    this.leadsService.assign(lead.id, { agentId }).subscribe({
      next: (updated) => {
        this.travelDetailsData.set(updated);
        this.snackBar.open('Лид переназначен', 'Close', { duration: 4000 });
      },
      error: (err: unknown) => {
        this.snackBar.open(this.getErrorMessage(err, 'Не удалось назначить лид'), 'Close', {
          duration: 5000,
        });
      },
      complete: () => {
        this.assignLoading.set(false);
      },
    });
  }

  protected openLinkClientDialog(): void {
    const lead = this.lead();

    if (!lead || this.isTerminalStatus(lead.status)) {
      return;
    }

    const dialogRef = this.dialog.open(LinkLeadClientDialogComponent, {
      width: '640px',
      data: {
        leadId: lead.id,
        initialClientId: lead.clientId,
      },
    });

    dialogRef.afterClosed().subscribe((updatedLead: LeadResponseDto | undefined) => {
      if (!updatedLead) {
        return;
      }

      this.travelDetailsData.set(updatedLead);
      this.patchTravelForm(updatedLead);
      this.snackBar.open('Клиент привязан к лиду', 'Close', { duration: 4000 });
    });
  }

  protected openPromoteClientDialog(): void {
    const lead = this.lead();

    if (!lead || this.isTerminalStatus(lead.status)) {
      return;
    }

    const dialogRef = this.dialog.open(PromoteLeadClientDialogComponent, {
      width: '860px',
      maxWidth: '96vw',
      data: {
        lead,
      },
    });

    dialogRef.afterClosed().subscribe((updatedLead: LeadResponseDto | undefined) => {
      if (!updatedLead) {
        return;
      }

      this.travelDetailsData.set(updatedLead);
      this.patchTravelForm(updatedLead);
      this.snackBar.open('Лид сохранён как новый клиент', 'Close', { duration: 4000 });
    });
  }

  protected changeContactPerson(contact: ContactResponseDto): void {
    const lead = this.lead();

    if (!lead) {
      return;
    }

    this.leadsService.updateContactPerson(lead.id, { contactPersonId: contact.id }).subscribe({
      next: (updated) => {
        this.travelDetailsData.set(updated);
        this.snackBar.open('Контактное лицо изменено', 'Close', { duration: 4000 });
      },
      error: (err: unknown) => {
        this.snackBar.open(
          this.getErrorMessage(err, 'Не удалось изменить контактное лицо'),
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  protected showTravelContactGroupError(): boolean {
    return (
      this.travelForm.hasError('atLeastOneContactRequired') &&
      (this.travelForm.controls.contactPhone.touched ||
        this.travelForm.controls.contactEmail.touched ||
        this.travelForm.controls.contactTelegram.touched)
    );
  }

  protected startEditTravelDetails(): void {
    const lead = this.lead();

    if (!lead || this.isTerminalStatus(lead.status)) {
      return;
    }

    this.patchTravelForm(lead);
    this.editingTravelDetails.set(true);
  }

  protected cancelEditTravelDetails(): void {
    const lead = this.lead();

    if (lead) {
      this.patchTravelForm(lead);
    }

    this.editingTravelDetails.set(false);
  }

  protected saveTravelDetails(): void {
    const lead = this.lead();

    if (!lead || this.savingTravelDetails() || this.isTerminalStatus(lead.status)) {
      return;
    }

    if (this.travelForm.invalid) {
      this.travelForm.markAllAsTouched();

      return;
    }

    this.savingTravelDetails.set(true);
    this.leadsService
      .update(lead.id, {
        contactPhone: (this.travelForm.controls.contactPhone.value ?? '').trim() || null,
        contactEmail: (this.travelForm.controls.contactEmail.value ?? '').trim() || null,
        contactTelegram: (this.travelForm.controls.contactTelegram.value ?? '').trim() || null,
        destination: this.normalizeText(this.travelForm.controls.destination.value),
        departDateFrom: this.normalizeText(this.travelForm.controls.departDateFrom.value),
        departDateTo: this.normalizeText(this.travelForm.controls.departDateTo.value),
        returnDateFrom: this.normalizeText(this.travelForm.controls.returnDateFrom.value),
        returnDateTo: this.normalizeText(this.travelForm.controls.returnDateTo.value),
        adults: this.travelForm.controls.adults.value ?? undefined,
        children: this.travelForm.controls.children.value ?? undefined,
        notes: this.normalizeText(this.travelForm.controls.notes.value),
      })
      .subscribe({
        next: (updated) => {
          this.travelDetailsData.set(updated);
          this.patchTravelForm(updated);
          this.editingTravelDetails.set(false);
          this.snackBar.open('Детали тура обновлены', 'Close', { duration: 4000 });
        },
        error: (err: unknown) => {
          // prettier-ignore
          this.snackBar.open(this.getErrorMessage(err, 'Не удалось обновить детали тура'), 'Close', { duration: 5000 });
        },
        complete: () => {
          this.savingTravelDetails.set(false);
        },
      });
  }

  protected openNewOffer(): void {
    const lead = this.lead();

    if (!lead) {
      return;
    }

    void this.router.navigate(['/app/offers/new'], {
      queryParams: { leadId: lead.id },
    });
  }

  protected loadMoreActivity(): void {
    const lead = this.lead();

    if (!lead || this.loadingMoreActivity() || !this.canLoadMoreActivity()) {
      return;
    }

    const nextPage = this.activityPage() + 1;

    this.loadingMoreActivity.set(true);
    this.leadsService
      .getActivity(lead.id, {
        page: nextPage,
        limit: ACTIVITY_PAGE_SIZE,
      })
      .pipe(
        catchError((err) => {
          // prettier-ignore
          this.snackBar.open(this.getErrorMessage(err, 'Не удалось загрузить активность'), 'Close', { duration: 5000 });

          return of({
            items: [],
            total: this.activityTotal(),
            page: nextPage,
            limit: ACTIVITY_PAGE_SIZE,
          });
        }),
      )
      .subscribe((res) => {
        this.activityPage.set(nextPage);
        this.activityTotal.set(res.total ?? this.activityTotal());

        const merged = [...this.activityItems(), ...res.items];
        // NOSONAR — sort on a fresh copy, not the original array
        const ordered = [...merged].sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );

        this.activityItems.set(ordered);
        this.loadingMoreActivity.set(false);
      });
  }

  protected openDeleteDialog(): void {
    const lead = this.lead();

    if (!lead) {
      return;
    }

    const hasOffers = this.offers().length > 0;

    const dialogRef = this.dialog.open(DeleteLeadDialogComponent, {
      width: '480px',
      data: {
        leadId: lead.id,
        leadNumber: lead.number,
        hasOffers,
      },
    });

    dialogRef.afterClosed().subscribe((result: DeleteLeadDialogResult | undefined) => {
      if (result?.deleted) {
        void this.router.navigate(['/app/leads']);
      }
    });
  }

  protected goBackToLeads(): void {
    void this.router.navigate(['/app/leads']);
  }

  protected getErrorStatus(): number | null {
    const err = this.error();

    if (err instanceof HttpErrorResponse) {
      return err.status;
    }

    return null;
  }

  protected readonly getAgentInitials = getAgentInitials;
  protected readonly formatDateShort = formatDateShort;
  protected readonly formatDateTime = formatDateTime;
  protected readonly formatDateRange = formatDateRange;

  protected readonly getActivityIcon = getActivityIcon;

  protected getActivityLabel(type: string): string {
    if (type === 'contact_person_selected') {
      return 'Контактное лицо изменено';
    }

    return type
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (value) => value.toUpperCase());
  }

  protected getActivityActor(item: ActivityResponseDto): string {
    const payload = item.payload;
    const actorName =
      payload && typeof payload['actorName'] === 'string' ? payload['actorName'] : null;

    if (actorName) {
      return actorName;
    }

    const createdBy = item.createdBy?.trim() ?? '';
    const normalizedCreatedBy = this.normalizeActivityActor(createdBy);

    if (normalizedCreatedBy === 'system' || normalizedCreatedBy === 'system action') {
      return 'Системное действие';
    }

    const resolvedActorName = this.activityActorNameByUserId().get(createdBy);

    if (resolvedActorName) {
      return resolvedActorName;
    }

    if (createdBy) {
      return createdBy;
    }

    return 'Системное действие';
  }

  protected isSystemEvent(item: ActivityResponseDto): boolean {
    const createdBy = this.normalizeActivityActor(item.createdBy);

    return createdBy === 'system' || createdBy === 'system action';
  }

  private normalizeActivityActor(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private isTerminalStatus(status: string): boolean {
    return TERMINAL_STATUSES.has(status);
  }

  private patchTravelForm(lead: LeadResponseDto): void {
    this.travelForm.patchValue({
      contactPhone: lead.contactPhone ?? '',
      contactEmail: lead.contactEmail ?? '',
      contactTelegram: lead.contactTelegram ?? '',
      destination: lead.destination ?? '',
      departDateFrom: this.asDateInputValue(lead.departDateFrom),
      departDateTo: this.asDateInputValue(lead.departDateTo),
      returnDateFrom: this.asDateInputValue(lead.returnDateFrom),
      returnDateTo: this.asDateInputValue(lead.returnDateTo),
      adults: lead.adults,
      children: lead.children,
      notes: lead.notes ?? '',
    });
  }

  private asDateInputValue(value: string | null): string {
    return value ? value.slice(0, 10) : '';
  }

  private normalizeText(value: string | null | undefined): string | undefined {
    const trimmed = value?.trim();

    return trimmed || undefined;
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? fallback;
    }

    if (typeof err === 'object' && err !== null && 'message' in err) {
      const message = (err as { message?: string }).message;

      if (message) {
        return message;
      }
    }

    return fallback;
  }
}
