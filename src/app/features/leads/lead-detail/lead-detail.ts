/* eslint-disable max-lines */
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPTY, forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';
import { AssignDialogComponent } from '@app/features/leads/assign-dialog/assign-dialog';
import { LinkLeadClientDialogComponent } from '@app/features/leads/link-lead-client-dialog/link-lead-client-dialog';
// eslint-disable-next-line max-len
import { PromoteLeadClientDialogComponent } from '@app/features/leads/promote-lead-client-dialog/promote-lead-client-dialog';
import { LeadsService } from '@app/services/leads.service';
import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RequestsService } from '@app/services/requests.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { StatusBadgeComponent } from '@app/shared/components/status-badge.component';
import { MAT_BUTTONS, MAT_FORM_BUTTONS, MAT_MENU } from '@app/shared/material-imports';
import { LeadStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type {
  ActivityListResponseDto,
  ActivityResponseDto,
  LeadResponseDto,
  OfferResponseDto,
  RequestResponseDto,
} from '@app/shared/models';

type LeadAction = 'assign' | 'to_in_progress' | 'to_offer_sent' | 'mark_lost';

type LeadWithBooking = LeadResponseDto & {
  bookingId?: string | null;
  bookingNumber?: string | null;
  booking?: { id?: string | null; number?: string | null } | null;
};

type LeadDetailLoadData = {
  lead: LeadResponseDto;
  requests: RequestResponseDto[];
  offers: OfferResponseDto[];
  activities: ActivityListResponseDto;
};

const SALES_ROLES = new Set(['AGENT', 'SALES_AGENT', 'ADMIN', 'MANAGER']);
const TERMINAL_STATUSES = new Set<string>([LeadStatus.WON, LeadStatus.LOST, LeadStatus.EXPIRED]);
const REQUEST_TERMINAL_STATUSES = new Set<string>(['CLOSED']);
const ACTIVITY_PAGE_SIZE = 20;
const OFFER_STATUS_CLASS: Record<string, string> = {
  DRAFT: 'offer-status-draft',
  SENT: 'offer-status-sent',
  VIEWED: 'offer-status-viewed',
  ACCEPTED: 'offer-status-accepted',
  REJECTED: 'offer-status-rejected',
  EXPIRED: 'offer-status-expired',
};

const ACTION_LABELS: Record<LeadAction, string> = {
  assign: 'Assign',
  to_in_progress: 'In progress',
  to_offer_sent: 'Offer sent',
  mark_lost: 'Lost',
};

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
    ...MAT_BUTTONS,
    ...MAT_FORM_BUTTONS,
    ...MAT_MENU,
    StatusBadgeComponent,
    ClientTypeBadgeComponent,
    PageHeading,
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
  private readonly requestsService = inject(RequestsService);
  private readonly offersService = inject(OffersService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly toast = inject(ToastService);

  protected readonly permissions = inject(PermissionService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));
  private readonly travelDetailsData = signal<LeadResponseDto | null>(null);
  private readonly requestsData = signal<RequestResponseDto[]>([]);
  private readonly requestsDataInitialized = signal(false);

  private readonly data = rxResource<LeadDetailLoadData, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return forkJoin({
        lead: this.leadsService.findById(id),
        requests: this.requestsService
          .getList({ leadId: id, limit: 100 })
          .pipe(map((res) => res.items)),
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

  protected readonly lead = computed(
    () => this.travelDetailsData() ?? this.data.value()?.lead ?? null,
  );
  protected readonly requests = computed(() => {
    if (this.requestsDataInitialized()) {
      return this.requestsData();
    }

    return this.data.value()?.requests ?? [];
  });
  protected readonly offers = computed(() => this.data.value()?.offers ?? []);
  protected readonly loading = computed(() => this.data.isLoading());
  protected readonly error = computed(() => this.data.error());

  protected readonly canReassign = computed(() => {
    return this.permissions.canAssignLead();
  });

  protected readonly canManageLeadClient = computed(() => {
    const lead = this.lead();

    if (!lead) {
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

  protected readonly showAddTravelRequest = computed(() => !this.isTerminalLead());

  protected readonly offersByRequest = computed(() => {
    const mapByRequest = new Map<string, OfferResponseDto[]>();

    for (const offer of this.offers()) {
      const requestId = offer.requestId;

      if (!requestId) {
        continue;
      }

      const list = mapByRequest.get(requestId) ?? [];

      list.push(offer);
      mapByRequest.set(requestId, list);
    }

    return mapByRequest;
  });

  protected readonly bookingInfo = computed(() => {
    const lead = this.lead() as LeadWithBooking | null;

    if (!lead || lead.status !== LeadStatus.WON) {
      return null;
    }

    if (lead.bookingId) {
      return {
        id: lead.bookingId,
        number: lead.bookingNumber ?? 'Booking',
      };
    }

    if (lead.booking?.id) {
      return {
        id: lead.booking.id,
        number: lead.booking.number ?? 'Booking',
      };
    }

    return null;
  });

  protected readonly activityItems = signal<ActivityResponseDto[]>([]);
  protected readonly activityTotal = signal(0);
  protected readonly activityPage = signal(1);
  protected readonly loadingMoreActivity = signal(false);

  protected readonly canLoadMoreActivity = computed(() => {
    return this.activityItems().length < this.activityTotal();
  });

  protected readonly statusActionLoading = signal<LeadAction | null>(null);
  protected readonly assignLoading = signal(false);
  protected readonly savingTravelDetails = signal(false);
  protected readonly editingTravelDetails = signal(false);
  protected readonly showAddRequestForm = signal(false);
  protected readonly savingRequest = signal(false);
  protected readonly editingRequestId = signal<string | null>(null);
  protected readonly updatingRequest = signal(false);
  protected readonly deletingRequestId = signal<string | null>(null);
  protected readonly expandedNotesRequestId = signal<string | null>(null);

  protected readonly travelForm = this.formBuilder.group({
    destination: this.formBuilder.control<string>(''),
    departDateFrom: this.formBuilder.control<string>(''),
    departDateTo: this.formBuilder.control<string>(''),
    returnDateFrom: this.formBuilder.control<string>(''),
    returnDateTo: this.formBuilder.control<string>(''),
    adults: this.formBuilder.control<number | null>(null),
    children: this.formBuilder.control<number | null>(null),
    notes: this.formBuilder.control<string>(''),
  });

  protected readonly addRequestForm = this.formBuilder.group(
    {
      destination: this.formBuilder.control<string>('', {
        validators: [Validators.required],
      }),
      departDate: this.formBuilder.control<string>(''),
      returnDate: this.formBuilder.control<string>(''),
      adults: this.formBuilder.control<number | null>(1, {
        validators: [Validators.min(0)],
      }),
      children: this.formBuilder.control<number | null>(0, {
        validators: [Validators.min(0)],
      }),
      notes: this.formBuilder.control<string>(''),
      managerId: this.formBuilder.control<string>(''),
    },
    {
      validators: [this.returnDateAfterDepartDateValidator()],
    },
  );

  protected readonly editRequestForm = this.formBuilder.group(
    {
      destination: this.formBuilder.control<string>('', {
        validators: [Validators.required],
      }),
      departDate: this.formBuilder.control<string>(''),
      returnDate: this.formBuilder.control<string>(''),
      adults: this.formBuilder.control<number | null>(1, {
        validators: [Validators.min(0)],
      }),
      children: this.formBuilder.control<number | null>(0, {
        validators: [Validators.min(0)],
      }),
      notes: this.formBuilder.control<string>(''),
      managerId: this.formBuilder.control<string>(''),
    },
    {
      validators: [this.returnDateAfterDepartDateValidator()],
    },
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
      this.requestsData.set(value.requests);
      this.requestsDataInitialized.set(true);
      this.activityPage.set(1);
      this.activityTotal.set(value.activities.total ?? value.activities.items.length);

      const ordered = [...value.activities.items].sort((left, right) => {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });

      this.activityItems.set(ordered);
      this.patchTravelForm(value.lead);
      this.editingTravelDetails.set(false);
      this.resetRequestEditingState();
    });
  }

  protected getActionLabel(action: LeadAction): string {
    return ACTION_LABELS[action];
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

  protected isActionBusy(action: LeadAction): boolean {
    return this.statusActionLoading() === action;
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

    this.statusActionLoading.set(action);
    this.leadsService.updateStatus(lead.id, { status: targetStatus }).subscribe({
      next: (updated) => {
        this.travelDetailsData.set(updated);
        this.toast.showSuccess('Lead status was updated');
      },
      error: (err: unknown) => {
        this.toast.showError(this.getErrorMessage(err, 'Failed to update status'));
      },
      complete: () => {
        this.statusActionLoading.set(null);
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
        this.toast.showSuccess('Lead was reassigned');
      },
      error: (err: unknown) => {
        this.toast.showError(this.getErrorMessage(err, 'Failed to assign lead'));
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
      this.toast.showSuccess('Client was linked to lead');
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
      this.toast.showSuccess('Lead was saved as a new client');
    });
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

    this.savingTravelDetails.set(true);
    this.leadsService
      .update(lead.id, {
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
          this.toast.showSuccess('Travel details were updated');
        },
        error: (err: unknown) => {
          this.toast.showError(this.getErrorMessage(err, 'Failed to update travel details'));
        },
        complete: () => {
          this.savingTravelDetails.set(false);
        },
      });
  }

  protected createTravelRequest(): void {
    this.showAddRequestForm.update((value) => !value);

    if (!this.showAddRequestForm()) {
      this.addRequestForm.reset({
        destination: '',
        departDate: '',
        returnDate: '',
        adults: 1,
        children: 0,
        notes: '',
        managerId: '',
      });
    }
  }

  protected saveTravelRequest(): void {
    const lead = this.lead();

    if (!lead || this.savingRequest()) {
      return;
    }

    if (this.addRequestForm.invalid) {
      this.addRequestForm.markAllAsTouched();

      return;
    }

    const value = this.addRequestForm.getRawValue();

    this.savingRequest.set(true);
    this.requestsService
      .create({
        leadId: lead.id,
        destination: this.normalizeText(value.destination),
        departDate: this.normalizeText(value.departDate),
        returnDate: this.normalizeText(value.returnDate),
        adults: value.adults ?? undefined,
        children: value.children ?? undefined,
        notes: this.normalizeText(value.notes),
        managerId: this.normalizeText(value.managerId),
      })
      .pipe(
        finalize(() => {
          this.savingRequest.set(false);
        }),
      )
      .subscribe({
        next: (created) => {
          this.requestsData.update((items) => [created, ...items]);
          this.showAddRequestForm.set(false);
          this.addRequestForm.reset({
            destination: '',
            departDate: '',
            returnDate: '',
            adults: 1,
            children: 0,
            notes: '',
            managerId: '',
          });
          this.toast.showSuccess('Travel request was created');
        },
        error: (err: unknown) => {
          this.toast.showError(this.getErrorMessage(err, 'Failed to create travel request'));
        },
      });
  }

  protected cancelAddTravelRequest(): void {
    this.showAddRequestForm.set(false);
    this.addRequestForm.reset({
      destination: '',
      departDate: '',
      returnDate: '',
      adults: 1,
      children: 0,
      notes: '',
      managerId: '',
    });
  }

  protected editTravelRequest(request: RequestResponseDto): void {
    this.editingRequestId.set(request.id);
    this.editRequestForm.reset({
      destination: request.destination ?? '',
      departDate: this.asDateInputValue(request.departDate),
      returnDate: this.asDateInputValue(request.returnDate),
      adults: request.adults ?? 1,
      children: request.children ?? 0,
      notes: request.notes ?? '',
      managerId: request.managerId ?? '',
    });
  }

  protected cancelEditTravelRequest(): void {
    this.editingRequestId.set(null);
  }

  protected saveEditedTravelRequest(requestId: string): void {
    if (this.updatingRequest()) {
      return;
    }

    if (this.editRequestForm.invalid) {
      this.editRequestForm.markAllAsTouched();

      return;
    }

    const value = this.editRequestForm.getRawValue();

    this.updatingRequest.set(true);
    this.requestsService
      .update(requestId, {
        destination: this.normalizeText(value.destination),
        departDate: this.normalizeText(value.departDate),
        returnDate: this.normalizeText(value.returnDate),
        adults: value.adults ?? undefined,
        children: value.children ?? undefined,
        notes: this.normalizeText(value.notes),
        managerId: this.normalizeText(value.managerId),
      })
      .pipe(
        finalize(() => {
          this.updatingRequest.set(false);
        }),
      )
      .subscribe({
        next: (updated) => {
          this.requestsData.update((items) => {
            return items.map((item) => {
              if (item.id === requestId) {
                return updated;
              }

              return item;
            });
          });
          this.editingRequestId.set(null);
          this.toast.showSuccess('Travel request was updated');
        },
        error: (err: unknown) => {
          this.toast.showError(this.getErrorMessage(err, 'Failed to update travel request'));
        },
      });
  }

  protected isEditingRequest(requestId: string): boolean {
    return this.editingRequestId() === requestId;
  }

  protected getRequestIdentifier(request: RequestResponseDto, index: number): string {
    return `TR-${index + 1}`;
  }

  protected canDeleteRequest(request: RequestResponseDto): boolean {
    const offersCount = request.offersCount ?? 0;

    return offersCount === 0;
  }

  protected deleteRequest(request: RequestResponseDto, index: number): void {
    if (!this.canDeleteRequest(request) || this.deletingRequestId()) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${this.getRequestIdentifier(request, index)}?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingRequestId.set(request.id);
    this.requestsService
      .delete(request.id)
      .pipe(
        finalize(() => {
          this.deletingRequestId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.requestsData.update((items) => items.filter((item) => item.id !== request.id));
          this.toast.showSuccess('Travel request was deleted');
        },
        error: (err: unknown) => {
          this.toast.showError(this.getErrorMessage(err, 'Failed to delete travel request'));
        },
      });
  }

  protected openNewOffer(requestId: string): void {
    void this.router.navigate(['/app/offers/new'], {
      queryParams: { requestId },
    });
  }

  protected canCreateOfferForRequest(status: string): boolean {
    return !REQUEST_TERMINAL_STATUSES.has(status) && this.permissions.canCreateOffer();
  }

  protected getRequestStatusClass(status: string | null | undefined): string {
    if (status === 'OPEN') {
      return 'request-status-open';
    }

    if (status === 'QUOTED') {
      return 'request-status-quoted';
    }

    if (status === 'CLOSED') {
      return 'request-status-closed';
    }

    return 'request-status-default';
  }

  protected getRequestStatusLabel(status: string | null | undefined): string {
    if (status === 'OPEN') {
      return 'Open';
    }

    if (status === 'QUOTED') {
      return 'Quoted';
    }

    if (status === 'CLOSED') {
      return 'Closed';
    }

    return status ?? 'Unknown';
  }

  protected getOfferStatusClass(status: string | null | undefined): string {
    if (!status) {
      return 'offer-status-default';
    }

    return OFFER_STATUS_CLASS[status] ?? 'offer-status-default';
  }

  protected getOfferTooltip(offer: OfferResponseDto): string {
    const amount = offer.total;
    const currency = offer.currency;

    if (amount === null || amount === undefined) {
      return 'Total is not set';
    }

    if (!currency) {
      return `Total: ${amount}`;
    }

    return `Total: ${amount} ${currency}`;
  }

  protected toggleNotesExpanded(requestId: string): void {
    const current = this.expandedNotesRequestId();

    this.expandedNotesRequestId.set(current === requestId ? null : requestId);
  }

  protected isNotesExpanded(requestId: string): boolean {
    return this.expandedNotesRequestId() === requestId;
  }

  protected canShowDateRangeError(formName: 'add' | 'edit'): boolean {
    const form = formName === 'add' ? this.addRequestForm : this.editRequestForm;

    if (!form.hasError('invalidReturnDateRange')) {
      return false;
    }

    const returnDateControl = form.get('returnDate');

    return Boolean(returnDateControl?.dirty || returnDateControl?.touched);
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
          this.toast.showError(this.getErrorMessage(err, 'Failed to load activity'));

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
        const ordered = merged.sort((left, right) => {
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        });

        this.activityItems.set(ordered);
        this.loadingMoreActivity.set(false);
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

  protected getOffersForRequest(requestId: string): OfferResponseDto[] {
    return this.offersByRequest().get(requestId) ?? [];
  }

  protected getAgentInitials(name: string | null): string {
    if (!name) {
      return 'NA';
    }

    const parts = name
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2);

    if (parts.length === 0) {
      return 'NA';
    }

    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  }

  protected formatDateRange(
    from: string | null | undefined,
    to: string | null | undefined,
  ): string {
    const fromText = this.formatDateShort(from ?? null);
    const toText = this.formatDateShort(to ?? null);

    if (fromText === '—' && toText === '—') {
      return '—';
    }

    if (fromText !== '—' && toText !== '—') {
      return `${fromText} - ${toText}`;
    }

    return fromText !== '—' ? fromText : toText;
  }

  protected formatDateShort(iso: string | null): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }

  protected formatDateTime(iso: string | null): string {
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

  protected getActivityIcon(type: string): string {
    const normalized = type.toLowerCase();

    if (normalized.includes('create')) {
      return 'add_circle';
    }

    if (normalized.includes('status')) {
      return 'flag';
    }

    if (normalized.includes('assign')) {
      return 'person_add';
    }

    if (normalized.includes('offer')) {
      return 'description';
    }

    return 'history';
  }

  protected getActivityLabel(type: string): string {
    return type
      .replace(/_/g, ' ')
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
      return 'System action';
    }

    const resolvedActorName = this.activityActorNameByUserId().get(createdBy);

    if (resolvedActorName) {
      return resolvedActorName;
    }

    if (createdBy) {
      return createdBy;
    }

    return 'System action';
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
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
  }

  private normalizeText(value: string | null | undefined): string | undefined {
    const trimmed = value?.trim();

    return trimmed ? trimmed : undefined;
  }

  private resetRequestEditingState(): void {
    this.showAddRequestForm.set(false);
    this.savingRequest.set(false);
    this.editingRequestId.set(null);
    this.updatingRequest.set(false);
    this.addRequestForm.reset({
      destination: '',
      departDate: '',
      returnDate: '',
      adults: 1,
      children: 0,
      notes: '',
      managerId: '',
    });
    this.editRequestForm.reset({
      destination: '',
      departDate: '',
      returnDate: '',
      adults: 1,
      children: 0,
      notes: '',
      managerId: '',
    });
  }

  private returnDateAfterDepartDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control;
      const departDate = String(group.get('departDate')?.value ?? '').trim();
      const returnDate = String(group.get('returnDate')?.value ?? '').trim();

      if (!departDate || !returnDate) {
        return null;
      }

      if (returnDate >= departDate) {
        return null;
      }

      return { invalidReturnDateRange: true };
    };
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

  private getActivityActorFromPayload(item: ActivityResponseDto): string | null {
    const payload = item.payload;

    return payload && typeof payload['actorName'] === 'string' ? payload['actorName'] : null;
  }
}
